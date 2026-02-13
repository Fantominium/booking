# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link "TruFlow Logo TruFlow" [ref=e6] [cursor=pointer]:
        - /url: /
        - img "TruFlow Logo" [ref=e7]
        - heading "TruFlow" [level=1] [ref=e8]
      - navigation [ref=e9]:
        - navigation "Breadcrumb" [ref=e10]:
          - list [ref=e11]:
            - listitem [ref=e12]:
              - generic [ref=e13]: Home
      - button "Switch to dark mode" [ref=e15]:
        - img [ref=e16]
  - main [ref=e18]:
    - main [ref=e19]:
      - generic [ref=e20]:
        - heading "Deep Tissue Massage" [level=1] [ref=e21]
        - paragraph [ref=e22]: Deep tissue massage with focused pressure.
        - generic [ref=e23]: 60 minutes · $80.00
      - heading "Select a date" [level=2] [ref=e26]
  - button "Open Next.js Dev Tools" [ref=e32] [cursor=pointer]:
    - img [ref=e33]
  - alert [ref=e36]
```