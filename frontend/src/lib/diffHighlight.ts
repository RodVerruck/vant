import React from 'react';

function tokenizeForDiff(text: string) {
  return text.match(/\w+|[^\w\s]+|\s+/g) ?? [];
}

function normalizeDiffToken(token: string) {
  return token.trim().toLowerCase();
}

export function renderOptimizedTextWithHighlights(currentText?: string, optimizedText?: string) {
  if (!optimizedText) {
    return "Exemplo não disponível";
  }

  const manualParts = optimizedText.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  const hasManualHighlights = manualParts.some((part) => part.startsWith("**") && part.endsWith("**"));

  if (hasManualHighlights) {
    return manualParts.map((part, index) => {
      const isHighlighted = part.startsWith("**") && part.endsWith("**");
      const content = isHighlighted ? part.slice(2, -2) : part;

      if (isHighlighted) {
        return React.createElement(
          'span',
          { 
            key: `optimized-highlight-${index}`,
            className: "optimized-highlight" 
          },
          content
        );
      }

      return React.createElement(
        'span',
        { 
          key: `optimized-text-${index}` 
        },
        content
      );
    });
  }

  const normalizedCurrent = (currentText ?? "").replace(/\*\*/g, "");
  const normalizedOptimized = optimizedText.replace(/\*\*/g, "");

  const currentTokens = tokenizeForDiff(normalizedCurrent);
  const optimizedTokens = tokenizeForDiff(normalizedOptimized);
  const currentNormalized = currentTokens.map(normalizeDiffToken);
  const optimizedNormalized = optimizedTokens.map(normalizeDiffToken);

  const lcsMatrix = Array.from({ length: currentTokens.length + 1 }, () =>
    Array(optimizedTokens.length + 1).fill(0)
  );

  for (let i = currentTokens.length - 1; i >= 0; i -= 1) {
    for (let j = optimizedTokens.length - 1; j >= 0; j -= 1) {
      if (currentNormalized[i] && currentNormalized[i] === optimizedNormalized[j]) {
        lcsMatrix[i][j] = lcsMatrix[i + 1][j + 1] + 1;
      } else {
        lcsMatrix[i][j] = Math.max(lcsMatrix[i + 1][j], lcsMatrix[i][j + 1]);
      }
    }
  }

  const segments: Array<{ text: string; highlighted: boolean }> = [];

  let i = 0;
  let j = 0;

  while (j < optimizedTokens.length) {
    const optimizedToken = optimizedTokens[j];
    const normalizedOptimizedToken = optimizedNormalized[j];

    const isWhitespace = normalizedOptimizedToken === "";
    const isMatch = i < currentTokens.length && currentNormalized[i] && currentNormalized[i] === normalizedOptimizedToken;

    if (isWhitespace || isMatch) {
      if (isMatch) {
        i += 1;
      }

      const previous = segments[segments.length - 1];
      if (previous && previous.highlighted === false) {
        previous.text += optimizedToken;
      } else {
        segments.push({ text: optimizedToken, highlighted: false });
      }

      j += 1;
      continue;
    }

    const shouldSkipCurrent = i < currentTokens.length && lcsMatrix[i + 1][j] >= lcsMatrix[i][j + 1];

    if (shouldSkipCurrent) {
      i += 1;
      continue;
    }

    const previous = segments[segments.length - 1];
    if (previous && previous.highlighted === true) {
      previous.text += optimizedToken;
    } else {
      segments.push({ text: optimizedToken, highlighted: true });
    }

    j += 1;
  }

  // Filter out highlights that are too small (less than 3 meaningful tokens)
  const MIN_HIGHLIGHT_TOKENS = 3;
  const filteredSegments = segments.map(segment => {
    if (!segment.highlighted) return segment;

    // Count meaningful tokens (non-whitespace, non-punctuation)
    const meaningfulTokens = segment.text.match(/\w+/g) || [];

    if (meaningfulTokens.length < MIN_HIGHLIGHT_TOKENS) {
      return { text: segment.text, highlighted: false };
    }

    return segment;
  });

  // Merge consecutive non-highlighted segments
  const mergedSegments: Array<{ text: string; highlighted: boolean }> = [];
  for (const segment of filteredSegments) {
    const last = mergedSegments[mergedSegments.length - 1];
    if (last && last.highlighted === segment.highlighted) {
      last.text += segment.text;
    } else {
      mergedSegments.push({ ...segment });
    }
  }

  return mergedSegments.map((segment, index) => {
    if (segment.highlighted) {
      return React.createElement(
        'span',
        { 
          key: `optimized-auto-highlight-${index}`,
          className: "optimized-highlight" 
        },
        segment.text
      );
    }

    return React.createElement(
      'span',
      { 
        key: `optimized-auto-text-${index}` 
      },
      segment.text
    );
  });
}
