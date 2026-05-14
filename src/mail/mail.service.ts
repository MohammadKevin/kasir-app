import { Injectable } from '@nestjs/common';

import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,

    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  async sendResetPasswordEmail(to: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.transporter.sendMail({
      from: process.env.MAIL_USER,

      to,

      subject: 'Reset Password',

      html: `
        <div style="font-family: Arial">
          <h2>Reset Password</h2>

          <p>
            Klik tombol dibawah untuk reset password.
          </p>

          <a
            href="${resetUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#ef4444;
              color:white;
              text-decoration:none;
              border-radius:8px;
            "
          >
            Reset Password
          </a>
        </div>
      `,
    });
  }
}
