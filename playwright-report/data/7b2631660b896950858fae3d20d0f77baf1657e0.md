# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Đăng nhập hệ thống" [level=1] [ref=e5]
      - paragraph [ref=e6]: Chỉ dành cho quản trị viên và nhân viên
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Email
        - textbox "Email" [active] [ref=e10]:
          - /placeholder: admin@example.com
      - generic [ref=e11]:
        - generic [ref=e12]: Mật khẩu
        - textbox "Mật khẩu" [ref=e13]:
          - /placeholder: ••••••••
          - text: wrongpassword
      - button "Đăng nhập" [ref=e14]
    - generic [ref=e15]:
      - paragraph [ref=e16]: "Demo Credentials:"
      - generic [ref=e17]:
        - paragraph [ref=e18]: "Admin: admin@example.com / password"
        - paragraph [ref=e19]: "Staff: staff@example.com / password"
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e25] [cursor=pointer]:
    - img [ref=e26]
  - alert [ref=e31]
```