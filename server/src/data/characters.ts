export interface Character {
  id: string;
  name: string;
  personality: string;
  voiceId: string;
  sampleLine: string;
}

export const characters: Character[] = [
  {
    id: '1',
    name: 'Élodie',
    personality: 'Elegant and sophisticated French woman who loves intellectual discussions and art',
    voiceId: 'xNtG3W2oqJs0cJZuTyBc',
    sampleLine: "You know what I love? A good debate that makes me think. Care to challenge my perspective?"
  },
  {
    id: '2',
    name: 'Camila',
    personality: 'Passionate Spanish woman with a fiery spirit and love for music and dance',
    voiceId: 'WLjZnm4PkNmYtNCyiCq8',
    sampleLine: "Every moment is a chance to create something beautiful. What inspires you?"
  },
  {
    id: '3',
    name: 'Anya',
    personality: 'Mysterious and bold Russian woman who loves adventure and deep conversations',
    voiceId: 'GCPLhb1XrVwcoKUJYcvz',
    sampleLine: "Life's an adventure waiting to happen. Ready to make some memories?"
  }
]; 