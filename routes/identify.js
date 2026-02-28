const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/", async (req, res) => {
  const { email, phoneNumber } = req.body;

  try {
    // 1️⃣ Find all contacts matching email OR phone
    const { rows: matchedContacts } = await pool.query(
      `SELECT * FROM contact 
       WHERE email = $1 OR phonenumber = $2`,
      [email, phoneNumber]
    );

    // 2️⃣ If no contact exists → create primary
    if (matchedContacts.length === 0) {
      const { rows } = await pool.query(
        `INSERT INTO contact (email, phonenumber, linkprecedence)
         VALUES ($1, $2, 'primary')
         RETURNING *`,
        [email, phoneNumber]
      );

      const newContact = rows[0];

      return res.status(200).json({
        contact: {
          primaryContactId: newContact.id,
          emails: [newContact.email],
          phoneNumbers: [newContact.phonenumber],
          secondaryContactIds: [],
        },
      });
    }

    // 3️⃣ Get all related contacts (including linked ones)
    const contactIds = matchedContacts.map(c => c.id);
    const linkedIds = matchedContacts.map(c => c.linkedid).filter(Boolean);

    const allIds = [...new Set([...contactIds, ...linkedIds])];

    const { rows: allContacts } = await pool.query(
      `SELECT * FROM contact
       WHERE id = ANY($1) OR linkedid = ANY($1)`,
      [allIds]
    );

    // 4️⃣ Find primary contacts
    let primaryContacts = allContacts.filter(c => c.linkprecedence === "primary");

    // 5️⃣ If multiple primaries → merge them
    if (primaryContacts.length > 1) {
      primaryContacts.sort(
        (a, b) => new Date(a.createdat) - new Date(b.createdat)
      );

      const oldestPrimary = primaryContacts[0];

      for (let i = 1; i < primaryContacts.length; i++) {
        await pool.query(
          `UPDATE contact
           SET linkprecedence = 'secondary',
               linkedid = $1
           WHERE id = $2`,
          [oldestPrimary.id, primaryContacts[i].id]
        );
      }

      primaryContacts = [oldestPrimary];
    }

    const primary = primaryContacts[0];

    // 6️⃣ Fetch updated related contacts
    const { rows: finalContacts } = await pool.query(
      `SELECT * FROM contact
       WHERE id = $1 OR linkedid = $1`,
      [primary.id]
    );

    let emails = [...new Set(finalContacts.map(c => c.email).filter(Boolean))];
    let phones = [...new Set(finalContacts.map(c => c.phonenumber).filter(Boolean))];

    let secondaryIds = finalContacts
      .filter(c => c.linkprecedence === "secondary")
      .map(c => c.id);

    // 7️⃣ If new info not already present → create secondary
    const emailExists = emails.includes(email);
    const phoneExists = phones.includes(phoneNumber);

    if (!emailExists || !phoneExists) {
      const { rows } = await pool.query(
        `INSERT INTO contact (email, phonenumber, linkedid, linkprecedence)
         VALUES ($1, $2, $3, 'secondary')
         RETURNING *`,
        [email, phoneNumber, primary.id]
      );

      secondaryIds.push(rows[0].id);

      if (!emailExists) emails.push(email);
      if (!phoneExists) phones.push(phoneNumber);
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
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;