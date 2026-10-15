import base64
import io
from datetime import datetime

import qrcode
from weasyprint import HTML

from app.core.config import settings

_TEMPLATE = """
<html>
<head>
<meta charset="utf-8" />
<style>
  @page {{ size: A4 landscape; margin: 0; }}
  body {{
    margin: 0;
    font-family: 'Liberation Sans', sans-serif;
    background: linear-gradient(135deg, #f8f9fc 0%, #eef0fd 100%);
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .frame {{
    position: relative;
    width: 1000px;
    height: 660px;
    background: #ffffff;
    border: 2px solid #4338CA;
    box-sizing: border-box;
    padding: 46px 70px;
    overflow: hidden;
  }}
  .inner-line {{
    position: absolute;
    inset: 14px;
    border: 1px solid #C7CCE8;
  }}
  .corner {{
    position: absolute;
    width: 34px;
    height: 34px;
    border: 3px solid #4338CA;
  }}
  .corner.tl {{ top: 20px; left: 20px; border-right: none; border-bottom: none; }}
  .corner.tr {{ top: 20px; right: 20px; border-left: none; border-bottom: none; }}
  .corner.bl {{ bottom: 20px; left: 20px; border-right: none; border-top: none; }}
  .corner.br {{ bottom: 20px; right: 20px; border-left: none; border-top: none; }}
  .watermark {{
    position: absolute;
    right: -50px;
    bottom: -70px;
    font-size: 320px;
    font-weight: 800;
    color: #4338CA;
    opacity: 0.045;
    font-family: 'Liberation Serif', serif;
    line-height: 1;
  }}
  .content {{ position: relative; text-align: center; }}
  .brand-row {{ display: flex; align-items: center; justify-content: center; gap: 10px; }}
  .logo {{
    width: 38px; height: 38px; border-radius: 9px; background: #4338CA; color: #fff;
    font-weight: 800; font-size: 18px; display: flex; align-items: center; justify-content: center;
  }}
  .brand {{ font-size: 20px; font-weight: 800; letter-spacing: 3px; color: #131522; }}
  .kicker {{
    margin-top: 30px; font-size: 12px; letter-spacing: 4px; color: #9297AB; text-transform: uppercase;
  }}
  .cert-title {{
    margin-top: 6px; font-size: 32px; font-weight: 800; color: #4338CA; letter-spacing: 2px;
    font-family: 'Liberation Serif', serif;
  }}
  .lead {{ margin-top: 26px; font-size: 14px; color: #6B7085; }}
  .name {{
    margin: 12px 0; font-size: 40px; font-weight: 700; color: #131522;
    font-family: 'Liberation Serif', serif; display: inline-block;
    padding-bottom: 8px; min-width: 480px; border-bottom: 1px solid #E6E8F0;
  }}
  .desc {{ margin-top: 16px; font-size: 14px; color: #6B7085; }}
  .course {{ margin: 8px 0 0; font-size: 22px; font-weight: 700; color: #131522; }}
  .footer {{
    margin-top: 44px; display: flex; align-items: flex-end; justify-content: space-between;
  }}
  .meta {{ text-align: left; font-size: 11.5px; color: #9297AB; line-height: 1.9; }}
  .meta strong {{ color: #131522; }}
  .signature {{ text-align: center; }}
  .signature .line {{ width: 170px; border-top: 1px solid #131522; margin: 0 auto 6px; }}
  .signature .role {{ font-size: 11.5px; color: #6B7085; }}
  .qr-wrap {{ text-align: center; }}
  img.qr {{ width: 80px; height: 80px; }}
  .qr-label {{ font-size: 9.5px; color: #9297AB; margin-top: 4px; }}
</style>
</head>
<body>
  <div class="frame">
    <div class="inner-line"></div>
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>
    <div class="watermark">E</div>
    <div class="content">
      <div class="brand-row">
        <span class="logo">E</span>
        <span class="brand">EDTECH</span>
      </div>
      <div class="kicker">Tugatish sertifikati</div>
      <div class="cert-title">SERTIFIKAT</div>
      <div class="lead">Ushbu sertifikat quyidagi shaxsga topshiriladi:</div>
      <div class="name">{student_name}</div>
      <div class="desc">quyidagi kursni muvaffaqiyatli tugatgani munosabati bilan:</div>
      <div class="course">{course_title}</div>
      <div class="footer">
        <div class="meta">
          Sertifikat raqami: <strong>{certificate_number}</strong><br />
          Berilgan sana: <strong>{issued_date}</strong>
        </div>
        <div class="signature">
          <div class="line"></div>
          <div class="role">EdTech platformasi</div>
        </div>
        <div class="qr-wrap">
          <img class="qr" src="data:image/png;base64,{qr_base64}" />
          <div class="qr-label">Tekshirish uchun skanerlang</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""


def _generate_qr_base64(url: str) -> str:
    img = qrcode.make(url)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def render_certificate_pdf(
    student_name: str, course_title: str, certificate_number: str, issued_at: datetime
) -> bytes:
    verify_url = f"{settings.PUBLIC_BASE_URL}/certificates/verify/{certificate_number}"
    qr_base64 = _generate_qr_base64(verify_url)

    html_content = _TEMPLATE.format(
        student_name=student_name,
        course_title=course_title,
        certificate_number=certificate_number,
        issued_date=issued_at.strftime("%Y-%m-%d"),
        qr_base64=qr_base64,
    )

    return HTML(string=html_content).write_pdf()
