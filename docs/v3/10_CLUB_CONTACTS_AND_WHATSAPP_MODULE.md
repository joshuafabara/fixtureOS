# Fixture Organizer App — Club Contacts and WhatsApp Module V3

## 1. Purpose

Maintain club contacts so tournament organizers can later send WhatsApp messages through Evolution API.

MVP stores contacts only. No message sending in MVP.

## 2. Requirements

Each club should have at least one contact.

Clubs may have multiple contacts.

One contact can be primary.

## 3. Contact Fields

- Contact name.
- Role/title.
- WhatsApp number.
- Primary flag.
- Notes.

## 4. WhatsApp Validation

Required storage format:

```
593998375914
```

Rules:

- Digits only.
- Country code + number.
- No plus sign.
- No spaces.
- No dashes.
- No parentheses.
- 10 to 15 digits.

Regex:

```
^[0-9]{10,15}$
```

Validation message in Spanish:

```
El número debe incluir código de país + número, solo dígitos. Ejemplo: 593998375914
```

## 5. Clubs Directory Page

Required filters:

- Category.
- Tournament.
- Free text search.
- Has WhatsApp: All, Missing, Present.

Required table columns:

- Club.
- Categories.
- Primary Contact.
- WhatsApp.
- Missing WhatsApp indicator.
- Actions.

WhatsApp number should be inline editable.

## 6. Club Detail Page

Show:

- Club name.
- Teams grouped by category.
- Contacts table.
- Add contact button.
- Mark primary action.

## 7. Communications Directory

MVP page for readiness only.

Show:

- Club.
- Primary Contact.
- WhatsApp.
- Categories.
- Last updated.
- Missing contact warning.

No send button yet, or show disabled future placeholder.

## 8. Audit

Audit every contact create/update/delete and WhatsApp number change.

## 9. Future Evolution API Preparation

Design future data fields:

- evolution_instance_id.
- last_message_sent_at.
- opt_out_status.
- message_template_id.

Do not implement sending in MVP.

