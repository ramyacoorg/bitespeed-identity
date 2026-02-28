const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/", async (req, res) => {
  const { email, phoneNumber } = req.body;

  try {
    // Find matching contacts
    const { rows: matchedContacts } = await pool.query(
      `SELECT * FROM contact 
       WHERE email = $1 OR phonenumber = $2`,
      [email || null, phoneNumber || null]
    );

    // If no contact exists → create primary
    if (matchedContacts.length === 0) {
      const { rows } = await pool.query(
        `INSERT INTO contact (email, phonenumber, linkprecedence)
         VALUES ($1, $2, 'primary')
         RETURNING *`,
        [email || null, phoneNumber || null]
      );

      const newContact = rows[0];

      return res.status(200).json({
        contact: {
          primaryContactId: newContact.id,
          emails: newContact.email ? [newContact.email] : [],
          phoneNumbers: newContact.phonenumber ? [newContact.phonenumber] : [],
          secondaryContactIds: [],
        },
      });
    }

    // Get primary contact (oldest)
    matchedContacts.sort(
      (a, b) => new Date(a.createdat) - new Date(b.createdat)
    );

    const primary = matchedContacts.find(
      (c) => c.linkprecedence === "primary"
    ) || matchedContacts[0];

    // Fetch all linked contacts
    const { rows: allContacts } = await pool.query(
      `SELECT * FROM contact 
       WHERE id = $1 OR linkedid = $1`,
      [primary.id]
    );

    let emails = [...new Set(allContacts.map(c => c.email).filter(Boolean))];
    let phones = [...new Set(allContacts.map(c => c.phonenumber).filter(Boolean))];
    let secondaryIds = allContacts
      .filter(c => c.linkprecedence === "secondary")
      .map(c => c.id);

    // If new info not present → create secondary
    if (!emails.includes(email) || !phones.includes(phoneNumber)) {
      const { rows } = await pool.query(
        `INSERT INTO contact (email, phonenumber, linkedid, linkprecedence)
         VALUES ($1, $2, $3, 'secondary')
         RETURNING *`,
        [email || null, phoneNumber || null, primary.id]
      );

      const newSecondary = rows[0];
      secondaryIds.push(newSecondary.id);

      if (newSecondary.email && !emails.includes(newSecondary.email))
        emails.push(newSecondary.email);

      if (newSecondary.phonenumber && !phones.includes(newSecondary.phonenumber))
        phones.push(newSecondary.phonenumber);
    }

    return res.status(200).json({
      contact: {
        primaryContactId: primary.id,
        emails,
        phoneNumbers: phones,
        secondaryContactIds: secondaryIds,
      },
    });

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;