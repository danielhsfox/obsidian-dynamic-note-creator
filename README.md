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
path: Notes/
nameButton: New Note
pathTemplate: templates/note.md
```
````

3. **Use it**:
   - Type to search existing notes
   - Click "New Note" to create from template

## 📝 Basic Setup

### 1. Choose where notes go
```
path: Projects/      # Folder for new notes
```

### 2. Add create buttons
```
nameButton: New Task, New Idea
colorButton: #ffffff, #ffffff
backgroundButton: #4a86e8, #e87c4a
```

### 3. Set templates
```
pathTemplate: templates/task.md, templates/idea.md
```

## 🎯 Real Example

````markdown
```dynamicsearch
title: Quick Create
path: Meetings/, Tasks/, Ideas/
nameButton: 📅 Meeting, ✅ Task, 💡 Idea
pathTemplate: templates/meeting.md, templates/task.md, templates/idea.md
```
````

This adds:
- A search bar for notes in those folders
- Three colored buttons to create different note types
- Each uses its own template

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

The plugin detects Templater code automatically.

## ⚙️ Settings

Go to **Settings → Dynamic Note Creator** to:
- Set default title
- Add multiple note types
- Configure colors and emojis
- Set default template paths

## 🔧 Tips

- **Search**: Type to find notes in real-time
- **Create**: Click any button to make a new note
- **Templates**: Put them in a `templates/` folder
- **Colors**: Use hex codes like `#814ae8`

## ❓ Need Help?

- **Template not found?** Check the path is correct
- **Search empty?** Verify folder exists
- **Buttons not working?** Check console logs (Ctrl+Shift+I)

---

**Simple. Fast. Powerful.** Create notes without leaving your workflow.

 
## License

MIT License - see [LICENSE](LICENSE) file

Copyright (c) 2025 danielhsfox