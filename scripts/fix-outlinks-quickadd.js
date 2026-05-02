/**
 * QuickAdd 脚本：修复索引卡中多层嵌套 [[ ]] 的 outlinks
 *
 * 使用方法（QuickAdd）：
 * 1. 安装 QuickAdd 插件
 * 2. 设置 → QuickAdd → Macro → 添加 → User Script（选择此文件）
 * 3. 点击执行
 *
 * 修复逻辑：
 *   ["[[[[轨道波函数的推导回顾]]]]"] → ["[[轨道波函数的推导回顾]]"]
 *   确保所有 outlinks 只有一层 [[ ]]
 */

module.exports = async function fixOutlinks(params) {
  const vault = app.vault;
  const indexDir = "00_INDEX/files";
  const folder = vault.getAbstractFileByPath(indexDir);

  if (!folder || !folder.children) {
    new Notice("❌ 00_INDEX/files/ 目录不存在");
    return;
  }

  let fixed = 0;
  let skipped = 0;

  for (const child of folder.children) {
    if (child.extension !== "md") continue;

    try {
      const content = await vault.cachedRead(child);

      // Extract YAML frontmatter
      const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;

      const fm = fmMatch[1];
      const body = content.slice(fmMatch[0].length);

      // Find and fix outlinks line
      const outlinksMatch = fm.match(/^outlinks:\s*(.*)$/m);
      if (!outlinksMatch) continue;

      const original = outlinksMatch[1].trim();

      // Parse the inline array ["...", "..."]
      const itemsMatch = original.match(/^\[(.*)\]$/);
      if (!itemsMatch) continue;

      const inner = itemsMatch[1];
      let links;
      if (inner.trim() === "") {
        links = [];
      } else {
        links = inner.split(",").map(s => {
          let cleaned = s.trim().replace(/^"|"$/g, "").trim();
          // Strip all bracket layers, then wrap with exactly one [[ ]]
          const core = cleaned.replace(/^\[+/g, "").replace(/\]+$/g, "");
          if (!core) return null;
          return `"[[${core}]]"`;
        }).filter(Boolean);
      }

      const fixedOutlinks = links.length > 0
        ? `outlinks: [${links.join(", ")}]`
        : "outlinks: []";

      // Check if actually changed
      const originalLine = `outlinks: ${original}`;
      if (originalLine === fixedOutlinks) {
        skipped++;
        continue;
      }

      // Replace in frontmatter
      const newFm = fm.replace(/^outlinks:.*$/m, fixedOutlinks);
      const newContent = `---\n${newFm}\n---${body}`;

      await vault.modify(child, newContent);
      fixed++;
    } catch (e) {
      console.warn(`[fix-outlinks] 处理失败: ${child.path}`, e);
    }
  }

  new Notice(`🔧 outlinks 修复完成: ${fixed} 张卡片, ${skipped} 张跳过`);
};
