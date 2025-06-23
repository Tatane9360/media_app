``` mermaid

erDiagram
    Admin ||--o{ Video : publishes
    Video ||--o| FilterSettings : has

    Admin {
        string id PK
        string email
        string password
    }

    Video {
        string id PK
        string admin_id FK
        string title
        string source_type
        string original_url
        string thumbnail_url
        int duration
        date created_at
    }

    FilterSettings {
        string id PK
        string video_id FK
        float brightness
        float contrast
        float saturation
        float hue
    }
```