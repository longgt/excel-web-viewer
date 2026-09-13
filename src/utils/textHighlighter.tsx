import React from 'react';

export interface TextMatchInfo {
  matches: boolean;
  matchCount: number;
}

export function checkCellMatch(
  text: string,
  query: string,
  caseSensitive: boolean,
  exactMatch: boolean
): boolean {
  if (!query || query.trim() === '') return false;
  if (!text) return false;

  const targetText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  if (exactMatch) {
    return targetText.trim() === searchQuery.trim();
  }

  return targetText.includes(searchQuery);
}

export function renderHighlightedText(
  text: string,
  query: string,
  caseSensitive: boolean,
  exactMatch: boolean,
  colorScheme: 'amber' | 'emerald' | 'sky' | 'rose' | 'violet' = 'amber',
  isCurrentMatch: boolean = false
): React.ReactNode {
  if (!query || query.trim() === '') {
    return text;
  }

  if (exactMatch) {
    const target = caseSensitive ? text.trim() : text.trim().toLowerCase();
    const q = caseSensitive ? query.trim() : query.trim().toLowerCase();
    if (target === q) {
      return (
        <mark
          className={`px-1 py-0.5 rounded font-medium ${
            isCurrentMatch
              ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-500'
              : colorScheme === 'emerald'
              ? 'bg-emerald-200 text-emerald-950'
              : colorScheme === 'sky'
              ? 'bg-sky-200 text-sky-950'
              : colorScheme === 'rose'
              ? 'bg-rose-200 text-rose-950'
              : colorScheme === 'violet'
              ? 'bg-violet-200 text-violet-950'
              : 'bg-amber-200 text-amber-950'
          }`}
        >
          {text}
        </mark>
      );
    }
    return text;
  }

  const flags = caseSensitive ? 'g' : 'gi';
  // Escape regex special characters
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, flags);
  const parts = text.split(regex);

  if (parts.length <= 1) {
    return text;
  }

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = caseSensitive ? part === query : part.toLowerCase() === query.toLowerCase();

        if (isMatch) {
          const colorClasses = isCurrentMatch
            ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-500 font-semibold'
            : colorScheme === 'emerald'
            ? 'bg-emerald-200 text-emerald-950 font-medium'
            : colorScheme === 'sky'
            ? 'bg-sky-200 text-sky-950 font-medium'
            : colorScheme === 'rose'
            ? 'bg-rose-200 text-rose-950 font-medium'
            : colorScheme === 'violet'
            ? 'bg-violet-200 text-violet-950 font-medium'
            : 'bg-amber-200 text-amber-950 font-medium';

          return (
            <mark key={index} className={`px-0.5 py-0.2 rounded ${colorClasses}`}>
              {part}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
