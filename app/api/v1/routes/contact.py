import logging

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.config import settings


logger = logging.getLogger(__name__)

router = APIRouter(tags=["Contact"])


class ContactRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    subject: str = Field(min_length=2, max_length=100)
    message: str = Field(min_length=1, max_length=5000)


class ContactResponse(BaseModel):
    message: str


@router.post(
    "/contact",
    response_model=ContactResponse,
    status_code=status.HTTP_200_OK,
)
async def send_contact_message(payload: ContactRequest) -> ContactResponse:
    """Send a Contact Us message to the configured GreenCore email."""

    if settings.email_provider.lower() != "resend":
        logger.warning(
            "Contact message received while EMAIL_PROVIDER=%s. "
            "Configure Resend before enabling production email delivery.",
            settings.email_provider,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured yet.",
        )

    if not settings.email_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured yet.",
        )

    phone = payload.phone or "Not provided"

    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenCore Contact Message</title>
</head>
<body style="margin:0;padding:0;background:#eef6f1;font-family:Arial,Helvetica,sans-serif;color:#18352a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#eef6f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #d7e8de;border-radius:16px;overflow:hidden;">

          <!-- GreenCore Header -->
          <tr>
            <td style="background:#123c2a;padding:30px 36px;">
              <div style="font-size:28px;font-weight:700;color:#ffffff;">
                Green<span style="color:#62d49b;">Core</span>
              </div>
              <div style="margin-top:8px;font-size:12px;font-weight:700;letter-spacing:2px;color:#9ee6bd;">
                CONTACT MESSAGE
              </div>
            </td>
          </tr>

          <!-- Introduction -->
          <tr>
            <td style="padding:34px 36px 20px;">
              <div style="font-size:24px;font-weight:700;color:#163d2d;">
                New message received
              </div>
              <div style="margin-top:8px;font-size:15px;line-height:24px;color:#668074;">
                Someone has contacted GreenCore through the website.
              </div>
            </td>
          </tr>

          <!-- Customer Details -->
          <tr>
            <td style="padding:10px 36px 0;">
              <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#438b68;">
                CUSTOMER DETAILS
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;background:#f4faf7;border:1px solid #dcece3;border-radius:12px;">
                <tr>
                  <td style="padding:15px 18px;border-bottom:1px solid #dcece3;width:28%;font-size:13px;font-weight:700;color:#527063;">
                    Name
                  </td>
                  <td style="padding:15px 18px;border-bottom:1px solid #dcece3;font-size:14px;color:#18352a;">
                    {payload.name}
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px 18px;border-bottom:1px solid #dcece3;font-size:13px;font-weight:700;color:#527063;">
                    Email
                  </td>
                  <td style="padding:15px 18px;border-bottom:1px solid #dcece3;font-size:14px;color:#18352a;">
                    {payload.email}
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px 18px;font-size:13px;font-weight:700;color:#527063;">
                    Phone
                  </td>
                  <td style="padding:15px 18px;font-size:14px;color:#18352a;">
                    {payload.phone or "Not provided"}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subject -->
          <tr>
            <td style="padding:28px 36px 0;">
              <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#438b68;">
                SUBJECT
              </div>
              <div style="margin-top:10px;padding:14px 16px;background:#f8fbf9;border-left:4px solid #45b978;border-radius:8px;font-size:16px;font-weight:600;color:#18352a;">
                {payload.subject}
              </div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:28px 36px 36px;">
              <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#438b68;">
                MESSAGE
              </div>
              <div style="margin-top:10px;padding:20px;background:#f4faf7;border:1px solid #dcece3;border-radius:12px;font-size:15px;line-height:25px;color:#29483b;white-space:pre-wrap;">
                {payload.message}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f7f3;padding:22px 36px;text-align:center;border-top:1px solid #dcece3;">
              <div style="font-size:16px;font-weight:700;color:#24563e;">
                Green<span style="color:#3aa96d;">Core</span>
              </div>
              <div style="margin-top:6px;font-size:12px;color:#789186;">
                Building a greener future together.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.email_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.email_from,
                    "to": [settings.contact_email],
                    "reply_to": str(payload.email),
                    "subject": f"GreenCore Contact: {payload.subject}",
                    "html": html,
                },
            )

        if response.status_code >= 400:
            logger.error(
                "Resend returned %s: %s",
                response.status_code,
                response.text,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to send your message right now.",
            )

    except httpx.HTTPError:
        logger.exception("Contact email delivery failed.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to send your message right now.",
        )

    logger.info(
        "Contact message sent from %s with subject %s",
        payload.email,
        payload.subject,
    )

    return ContactResponse(
        message="Your message has been sent successfully.",
    )
