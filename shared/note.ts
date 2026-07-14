export const emptyNoteError = "Bitte gib eine Meeting-Notiz ein, bevor du Aufgaben extrahierst.";

export function hasNoteContent(note: string): boolean {
  return note.trim().length > 0;
}
