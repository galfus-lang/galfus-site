---
name: create_post
description: Creates a new blog post for the Galfus Script website in the correct markdown format with appropriate frontmatter.
---

# Create Post Skill

Use this skill to create a new blog post for the Galfus Script website. The skill ensures the post follows the established filename convention and markdown frontmatter structure.

## Workflow

1. **Gather Information**:
   - Title of the post.
   - Date of the post (defaults to current date, format: `YYYY-MM-DD`).
   - A short description of the post.
   - Main content or topic to cover.
   - (Optional) Thumbnail image path.

2. **Generate Filename**:
   - The filename must follow the format: `YYYY-MM-DD-slugified-title.md`.
   - The slug should be lowercase and hyphen-separated.
   - Example: `2026-08-05-my-new-post.md`.
   - The file must be saved in the directory: `src/lib/markdown/posts/`.

3. **Construct Frontmatter**:
   - The markdown file must start with YAML frontmatter.
   - Required fields: `title`, `date`, `description`.
   - Optional fields: `thumbnail`.
   
   Example:
   ```markdown
   ---
   title: 'My New Post'
   date: 2026-08-05
   description: This is a short description of what the post is about.
   ---
   ```

4. **Generate Content**:
   - Write the post using standard Markdown.
   - Use headings (`## `, `### `) to structure the content.
   - Use bold (`**text**`), bullet points, and blockquotes where appropriate.
   - If writing Galfus code examples, use the `galfus` code block identifier: ` ```galfus `
   - Maintain the informative and educational tone observed in previous posts.

5. **Save File**:
   - Write the generated content to `src/lib/markdown/posts/<filename>.md` using the `write_to_file` tool.
