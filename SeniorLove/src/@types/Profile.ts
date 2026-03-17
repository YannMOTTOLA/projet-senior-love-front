
export interface IProfileCardVM {
  id: string;
  name: string;
  photoUrl: string;
  age?: number;
  isOnline: boolean;
  labels: string[];    
  city?: string;
}
