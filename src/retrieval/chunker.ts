/**
 * Markdown 切片器：按标题 + 段落边界做 token 级切片
 * 420 target / 64 overlap / 520 max tokens
 */

export interface Chunk {
  text: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
}

/**
 * Rough token estimation: CJK chars ~1 token, English words ~1.3 tokens, rest ~0.25
 */
function estimateTokens(text: string): number {
  const cjk = (text.match(/[一-鿿㐀-䶿豈-﫿]/g) || []).length;
  const words = (text.match(/[a-zA-Z]+/g) || []).length;
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const remaining = text.length - cjk - letters;
  return Math.max(1, Math.floor(cjk + words * 1.3 + remaining * 0.25));
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}

function splitSections(content: string): Array<{ text: string; pos: number }> {
  const sections: Array<{ text: string; pos: number }> = [];
  const headingRegex = /^#{2,3}\s+.+$/gm;
  let lastPos = 0;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    if (match.index > lastPos) {
      sections.push({ text: content.slice(lastPos, match.index), pos: lastPos });
    }
    lastPos = match.index;
  }
  if (lastPos < content.length) {
    sections.push({ text: content.slice(lastPos), pos: lastPos });
  }
  if (sections.length === 0) {
    sections.push({ text: content, pos: 0 });
  }
  return sections;
}

function splitParagraphs(text: string): string[] {
  const parts = text.split(/\n\s*\n/);
  return parts.map(p => p.trim()).filter(p => p.length > 0);
}

export function chunkMarkdown(
  content: string,
  targetTokens: number = 420,
  overlapTokens: number = 64,
  maxTokens: number = 520,
): Chunk[] {
  const body = stripFrontmatter(content);
  if (!body.trim()) return [];

  const sections = splitSections(body);
  const chunks: Chunk[] = [];

  let currentText = "";
  let currentStart = sections[0]?.pos ?? 0;

  for (const { text: secText, pos: secPos } of sections) {
    const testText = currentText ? `${currentText}\n\n${secText}`.trim() : secText;
    if (estimateTokens(testText) <= maxTokens) {
      if (currentText) {
        currentText = testText;
      } else {
        currentText = secText;
        currentStart = secPos;
      }
    } else {
      // Flush current
      if (currentText) {
        chunks.push({
          text: currentText,
          chunkIndex: chunks.length,
          startChar: currentStart,
          endChar: currentStart + currentText.length,
        });
      }
      // Split oversize section by paragraph
      if (estimateTokens(secText) > maxTokens) {
        const paragraphs = splitParagraphs(secText);
        let subText = "";
        let subStart = secPos;
        for (const para of paragraphs) {
          const testSub = subText ? `${subText}\n\n${para}`.trim() : para;
          if (estimateTokens(testSub) <= maxTokens) {
            if (subText) {
              subText = testSub;
            } else {
              subText = para;
              subStart = secPos + secText.indexOf(para);
            }
          } else {
            if (subText) {
              chunks.push({
                text: subText,
                chunkIndex: chunks.length,
                startChar: subStart,
                endChar: subStart + subText.length,
              });
            }
            subText = para;
            subStart = secPos + secText.indexOf(para);
          }
        }
        if (subText) {
          currentText = subText;
          currentStart = subStart;
        } else {
          currentText = "";
        }
      } else {
        currentText = secText;
        currentStart = secPos;
      }
    }
  }

  if (currentText) {
    chunks.push({
      text: currentText,
      chunkIndex: chunks.length,
      startChar: currentStart,
      endChar: currentStart + currentText.length,
    });
  }

  // ── Add overlap ──
  if (overlapTokens > 0 && chunks.length > 1) {
    const overlapped: Chunk[] = [chunks[0]];
    for (let i = 1; i < chunks.length; i++) {
      const prev = overlapped[overlapped.length - 1];
      const curr = chunks[i];
      let overlapText = "";
      for (let j = prev.text.length - 1; j >= 0; j--) {
        const candidate = prev.text.slice(j);
        if (estimateTokens(candidate) >= overlapTokens) {
          overlapText = candidate;
          break;
        }
      }
      overlapped.push({
        text: overlapText ? `${overlapText}\n\n${curr.text}` : curr.text,
        chunkIndex: curr.chunkIndex,
        startChar: curr.startChar,
        endChar: curr.endChar,
      });
    }
    return overlapped;
  }

  return chunks;
}
