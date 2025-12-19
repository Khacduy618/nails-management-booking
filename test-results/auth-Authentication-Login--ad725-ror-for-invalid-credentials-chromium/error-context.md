# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Đăng nhập hệ thống" [level=1] [ref=e5]
      - paragraph [ref=e6]: Chỉ dành cho quản trị viên và nhân viên
    - alert [ref=e7]:
      - generic [ref=e8]: Tài khoản không tồn tại
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: Email
        - textbox "Email" [ref=e12]:
          - /placeholder: admin@example.com
          - text: invalid@example.com
      - generic [ref=e13]:
        - generic [ref=e14]: Mật khẩu
        - textbox "Mật khẩu" [ref=e15]:
          - /placeholder: ••••••••
          - text: wrongpassword
      - button "Đăng nhập" [ref=e16]
    - generic [ref=e17]:
      - paragraph [ref=e18]: "Demo Credentials:"
      - generic [ref=e19]:
        - paragraph [ref=e20]: "Admin: admin@example.com / password"
        - paragraph [ref=e21]: "Staff: staff@example.com / password"
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
    - img [ref=e28]
  - alert [ref=e31]
```