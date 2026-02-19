# Dynamic Note Creator for Obsidian

Create notes instantly with templates while searching your vault, all in one place.

## ✨ What It Does

Add a search box with create buttons to any note. Type to search, or click a button to create a new note with a template.

## 🚀 Quick Start

1. **Install** from Community Plugins
2. **Add a block** to any note:
   - Use command: `Insert Dynamic Note Creator block`
   - Or type:

````markdown
```dynamicsearch
title: My Notes
---
path: Notes/
nameButton: New Note
pathTemplate: templates/note.md
```
````

3. **Use it**:
   - Type to search existing notes
   - Click "New Note" to create from template

## 📝 Basic Setup

### Simple configuration (one button)
````markdown
```dynamicsearch
title: Search:
---
path: Projects/
nameButton: ➕ New Project
colorButton: #ffffff
backgroundButton: #4a86e8
emoji: 🚀
pathTemplate: templates/project.md
```
````

### Multiple configurations (several buttons)
````markdown
```dynamicsearch
title: Quick Create:
---
path: Meetings/
nameButton: 📅 New Meeting
colorButton: #ffffff
backgroundButton: #4a86e8
emoji: 📅
pathTemplate: templates/meeting.md
---
path: Tasks/
nameButton: ✅ New Task
colorButton: #ffffff
backgroundButton: #e87c4a
emoji: ✅
pathTemplate: templates/task.md
---
path: Ideas/
nameButton: 💡 New Idea
colorButton: #ffffff
backgroundButton: #814ae8
emoji: 💡
pathTemplate: templates/idea.md
```
````

## 🎯 Real Example

````markdown
```dynamicsearch
title: Create & Search:
---
path: Daily/
nameButton: 📔 Daily Note
colorButton: #ffffff
backgroundButton: #4a86e8
emoji: 📔
pathTemplate: templates/daily.md
---
path: Projects/
nameButton: 🚀 New Project
colorButton: #ffffff
backgroundButton: #e87c4a
emoji: 🚀
pathTemplate: templates/project.md
---
path: Resources/
nameButton: 📚 New Resource
colorButton: #ffffff
backgroundButton: #27ae60
emoji: 📚
pathTemplate: templates/resource.md
```
````

This adds:
- A search bar that searches across all configured folders
- Three distinct buttons with different colors and emojis
- Each button creates notes in its own folder using specific templates

## 📄 Templates Made Easy

### Simple Template
Create `templates/note.md`:
```markdown
# {{title}}

Created: {{date}}

## Notes

-
```

### With Templater
```markdown
# <% tp.file.title %>

Date: <% tp.date.now() %>

---
Content here
```

The plugin detects Templater code automatically and processes it when creating notes.

## ⚙️ Settings

Go to **Settings → Dynamic Note Creator** to:
- Set default title
- Add multiple note types with custom:
  - **Folder path** - Where notes are saved
  - **Button text** - What appears on the button
  - **Colors** - Custom text and background colors
  - **Emoji** - Optional emoji prefix for new notes
  - **Template path** - Which template to use

## 🔧 Tips

- **Search**: Type to find notes across all configured folders in real-time
- **Create**: Click any button to make a new note with its template
- **Emojis**: Add emoji prefixes to organize notes visually
- **Templates**: Put them in a `templates/` folder for easy access
- **Colors**: Use hex codes like `#814ae8` for custom button styling
- **Format**: Use `---` between configurations for better readability
- **Flexibility**: Mix and match any number of configurations

## ❓ Need Help?

- **Template not found?** Check the path is correct (e.g., `templates/note.md`)
- **Search empty?** Verify folders exist and contain markdown files
- **Buttons not working?** Check console logs (Ctrl+Shift+I on PC, Cmd+Opt+I on Mac)
- **Wrong behavior?** Make sure each configuration has all required fields

## 📋 Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | No | Title displayed above the search box |
| `path` | Yes | Folder where notes are saved |
| `nameButton` | Yes | Text shown on the button |
| `colorButton` | Yes | Text color (hex) |
| `backgroundButton` | Yes | Button background color (hex) |
| `emoji` | No | Emoji prefix for new notes |
| `pathTemplate` | Yes | Path to template file |

---

**Simple. Fast. Powerful.** Create notes without leaving your workflow.

## License

MIT License - see [LICENSE](LICENSE) file

Copyright (c) 2025 danielhsfox
