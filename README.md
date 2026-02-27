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
   - Filter notes by emoji using the dropdown
   - See backlinks when search is empty

## 📝 Basic Setup

### Simple configuration (one button)
````markdown
```dynamicsearch
title: Search:
sortBy: name
sortOrder: asc
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
sortBy: date
sortOrder: desc
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

### Using current folder
````markdown
```dynamicsearch
title: Local Notes:
---
path: current
nameButton: ➕ New Note
colorButton: #ffffff
backgroundButton: #814ae8
emoji: 📝
pathTemplate: templates/note.md
```
````
The `path: current` setting saves notes in the same folder as the block.

## 🎯 Real Example

````markdown
```dynamicsearch
title: Create & Search:
sortBy: name
sortOrder: asc
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

## 🔍 Smart Features

### Natural Sorting
Files with numbers are sorted intelligently:
- ✅ **Correct**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- ❌ **Not**: 1, 10, 11, 2, 3, 4, 5, 6, 7, 8, 9

### Emoji Filter
- Notes with emoji prefixes (like "📝 Meeting notes") are automatically detected
- Dropdown shows all emojis with note counts
- Filter to see only notes with specific emojis
- Clean "🎯 All notes" option without numbers

### Backlinks View
When search is empty, shows notes that link to the current note with a 🔗 indicator

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
  - **Folder path** - Where notes are saved (use "current" for same folder)
  - **Button text** - What appears on the button
  - **Colors** - Custom text and background colors
  - **Emoji** - Optional emoji prefix for new notes
  - **Template path** - Which template to use

## 🔧 Tips

- **Search**: Type to find notes across all configured folders in real-time
- **Create**: Click any button to make a new note with its template
- **Emojis**: Add emoji prefixes to organize notes visually and use the filter
- **Templates**: Put them in a `templates/` folder for easy access
- **Colors**: Use hex codes like `#814ae8` for custom button styling
- **Format**: Use `---` between configurations for better readability
- **Sorting**: Configure with `sortBy: name|date` and `sortOrder: asc|desc`
- **Current folder**: Use `path: current` to save in the block's location
- **Flexibility**: Mix and match any number of configurations

## ❓ Need Help?

- **Template not found?** Check the path is correct (e.g., `templates/note.md`)
- **Search empty?** Verify folders exist and contain markdown files
- **Buttons not working?** Check console logs (Ctrl+Shift+I on PC, Cmd+Opt+I on Mac)
- **Wrong behavior?** Make sure each configuration has all required fields
- **Sorting wrong?** Try `sortBy: name` with `sortOrder: asc`

## 📋 Configuration Fields

### Global Settings (before `---`)
| Field | Required | Options | Default | Description |
|-------|----------|---------|---------|-------------|
| `title` | No | string | "Search:" | Title displayed above the search box |
| `sortBy` | No | `name`, `date` | `name` | How to sort results |
| `sortOrder` | No | `asc`, `desc` | `asc` | Sort direction |

### Button Configuration (after each `---`)
| Field | Required | Description |
|-------|----------|-------------|
| `path` | Yes | Folder where notes are saved (use "current" for block's folder) |
| `nameButton` | Yes | Text shown on the button |
| `colorButton` | Yes | Text color (hex) |
| `backgroundButton` | Yes | Button background color (hex) |
| `emoji` | No | Emoji prefix for new notes |
| `pathTemplate` | Yes | Path to template file |

## 🎨 Visual Guide

```
┌─────────────────────────────────────┐
│ Search:                    ➕ Add Note│  ← Title and buttons
├─────────────────────────────────────┤
│ 🔍 Search notes...        🎯 All notes│  ← Search + emoji filter
├─────────────────────────────────────┤
│ 3 results                            │  ← Result counter
├─────────────────────────────────────┤
│ • 📝 Meeting notes                   │  ← Search results
│   … key points discussed …           │      with preview
│ • 📝 Project ideas                    │
│   … brainstorming session …           │
└─────────────────────────────────────┘
```

---

**Simple. Fast. Powerful.** Create notes without leaving your workflow.

## License

MIT License - see [LICENSE](LICENSE) file

Copyright (c) 2025 danielhsfox
