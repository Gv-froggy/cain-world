// ============================================
// MÉMOIRE ÉPISODIQUE DE CAINE
// Il se souvient de ce qu'il a vécu
// Les souvenirs s'effacent progressivement
// ============================================

const CLE_STORAGE = 'caine_memoire'
const MAX_SOUVENIRS = 40

export class MemoireEpisodique {
  constructor() {
    this.souvenirs = []
    this.sessionDebut = Date.now()
    this.charger()
  }

  // Charge les souvenirs depuis localStorage
  charger() {
    try {
      const data = localStorage.getItem(CLE_STORAGE)
      if (data) {
        this.souvenirs = JSON.parse(data)
        console.log('Mémoire chargée — ' + this.souvenirs.length + ' souvenirs')
      }
    } catch(e) {
      this.souvenirs = []
    }
  }

  // Sauvegarde les souvenirs
  sauvegarder() {
    try {
      localStorage.setItem(CLE_STORAGE, JSON.stringify(this.souvenirs))
    } catch(e) {}
  }

  // Ajoute un souvenir
  // type : 'creation' | 'exploration' | 'observation' | 'emotion'
  ajouter(type, description, importance = 1) {
    const souvenir = {
      type,
      description,
      importance,
      timestamp: Date.now(),
      session: this.sessionDebut
    }
    this.souvenirs.unshift(souvenir)

    // Garde seulement les plus importants
    if (this.souvenirs.length > MAX_SOUVENIRS) {
      // Trie par importance puis garde les MAX_SOUVENIRS premiers
      this.souvenirs.sort((a, b) => b.importance - a.importance)
      this.souvenirs = this.souvenirs.slice(0, MAX_SOUVENIRS)
    }

    this.sauvegarder()
  }

  // Formate les souvenirs pour le prompt LLM
  // Retourne une string lisible par Ollama
  resumePourLLM() {
    if (this.souvenirs.length === 0) return 'Aucun souvenir pour le moment.'

    const maintenant = Date.now()
    const sessionActuelle = this.sessionDebut

    const lignes = this.souvenirs.slice(0, 8).map(s => {
      const age = maintenant - s.timestamp
      const memeSession = s.session === sessionActuelle

      let quand
      if (memeSession) {
        const minutes = Math.floor(age / 60000)
        quand = minutes < 1 ? 'il y a quelques instants' : 'il y a ' + minutes + ' min'
      } else {
        const sessions = Math.round((sessionActuelle - s.session) / 1000)
        quand = 'session précédente'
      }

      return '- ' + quand + ' : ' + s.description
    })

    return lignes.join('\n')
  }
}