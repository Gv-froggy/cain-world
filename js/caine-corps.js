// ============================================
// CORPS DE CAINE — VERSION PROCÉDURALE
// ============================================

const ARTICULATIONS = {
  hanches:    { nom: 'waist_309',         x: [-0.3, 0.3],  y: [-0.5, 0.5],  z: [-0.2, 0.2]  },
  poitrine:   { nom: 'chest_310',         x: [-0.3, 0.3],  y: [-0.3, 0.3],  z: [-0.2, 0.2]  },
  cou:        { nom: 'neck1_339',         x: [-0.4, 0.4],  y: [-0.5, 0.5],  z: [-0.2, 0.2]  },
  tete:       { nom: 'head_340',          x: [-0.3, 0.3],  y: [-0.6, 0.6],  z: [-0.2, 0.2]  },
  epauleG:    { nom: 'leftShoulder_342',  x: [-0.5, 0.5],  y: [-0.3, 0.3],  z: [-0.5, 1.5]  },
  brasG:      { nom: 'leftUpperArm_343',  x: [-0.5, 1.8],  y: [-0.8, 0.8],  z: [-0.3, 0.3]  },
  avantBrasG: { nom: 'leftForearm_345',   x: [0.0,  2.4],  y: [-0.3, 0.3],  z: [-0.1, 0.1]  },
  mainG:      { nom: 'leftHand_346',      x: [-0.5, 0.5],  y: [-0.3, 0.3],  z: [-0.4, 0.4]  },
  epauleD:    { nom: 'rightShoulder_312', x: [-0.5, 0.5],  y: [-0.3, 0.3],  z: [-1.5, 0.5]  },
  brasD:      { nom: 'rightUpperArm_313', x: [-0.5, 1.8],  y: [-0.8, 0.8],  z: [-0.3, 0.3]  },
  avantBrasD: { nom: 'rightForearm_315',  x: [0.0,  2.4],  y: [-0.3, 0.3],  z: [-0.1, 0.1]  },
  mainD:      { nom: 'rightHand_316',     x: [-0.5, 0.5],  y: [-0.3, 0.3],  z: [-0.4, 0.4]  },
  cuisseG:    { nom: 'leftThigh_372',     x: [-1.8, 0.5],  y: [-0.3, 0.3],  z: [-0.2, 0.8]  },
  molletG:    { nom: 'leftCalf_374',      x: [0.0,  2.2],  y: [-0.1, 0.1],  z: [-0.1, 0.1]  },
  piedG:      { nom: 'leftFoot_375',      x: [-0.5, 0.5],  y: [-0.2, 0.2],  z: [-0.2, 0.2]  },
  cuisseD:    { nom: 'rightThigh_366',    x: [-1.8, 0.5],  y: [-0.3, 0.3],  z: [-0.8, 0.2]  },
  molletD:    { nom: 'rightCalf_368',     x: [0.0,  2.2],  y: [-0.1, 0.1],  z: [-0.1, 0.1]  },
  piedD:      { nom: 'rightFoot_369',     x: [-0.5, 0.5],  y: [-0.2, 0.2],  z: [-0.2, 0.2]  },
}

export class GestionnaireCorps {

  constructor() {
    this.os = {}
    this.repos = {}
    this.cibles = {}
    this.scores = {}
    this.vitesseInterp = 0.05
    this._frameExploration = 0
    this._intervalle = 40
    this._essaiActuel = null
    this._pasCote = false
  }

  // ── Geste de création ────────────────────────────

  signalerGeste(type) {
    if (type === 'empiler') {
      if (this.os['brasD']) this.cibles['brasD'] = { x: this.repos['brasD'].x - 1.4, y: this.repos['brasD'].y, z: this.repos['brasD'].z }
      if (this.os['brasG']) this.cibles['brasG'] = { x: this.repos['brasG'].x - 1.4, y: this.repos['brasG'].y, z: this.repos['brasG'].z }
      if (this.os['tete'])  this.cibles['tete']  = { x: this.repos['tete'].x - 0.3,  y: this.repos['tete'].y,  z: this.repos['tete'].z  }
      console.log('Caine empile — bras levés !')
    } else {
      if (this.os['brasD'])      this.cibles['brasD']      = { x: this.repos['brasD'].x + 1.2,      y: this.repos['brasD'].y,      z: this.repos['brasD'].z      }
      if (this.os['avantBrasD']) this.cibles['avantBrasD'] = { x: this.repos['avantBrasD'].x + 0.4, y: this.repos['avantBrasD'].y, z: this.repos['avantBrasD'].z }
      console.log('Caine pose — bras tendu !')
    }
    setTimeout(() => {
      for (const cle of ['brasD', 'brasG', 'avantBrasD', 'tete']) {
        if (this.os[cle]) this.cibles[cle] = { ...this.repos[cle] }
      }
    }, 1000)
  }

  // ── Pas de marche — chaque pas = un déplacement ──

  declencherPas() {
    this._pasCote = !this._pasCote
    const t = this._pasCote ? 1 : -1

    // Cuisses alternées
    if (this.os['cuisseG']) this.cibles['cuisseG'] = { x: this.repos['cuisseG'].x + t * 0.5, y: this.repos['cuisseG'].y, z: this.repos['cuisseG'].z }
    if (this.os['cuisseD']) this.cibles['cuisseD'] = { x: this.repos['cuisseD'].x - t * 0.5, y: this.repos['cuisseD'].y, z: this.repos['cuisseD'].z }

    // Genou plié sur la jambe qui avance
    if (this.os['molletG']) this.cibles['molletG'] = { x: this.repos['molletG'].x + (t > 0 ? 0.4 : 0.0), y: this.repos['molletG'].y, z: this.repos['molletG'].z }
    if (this.os['molletD']) this.cibles['molletD'] = { x: this.repos['molletD'].x + (t < 0 ? 0.4 : 0.0), y: this.repos['molletD'].y, z: this.repos['molletD'].z }

    // Bras opposés qui balancent
    if (this.os['brasG']) this.cibles['brasG'] = { x: this.repos['brasG'].x - t * 0.3, y: this.repos['brasG'].y, z: this.repos['brasG'].z }
    if (this.os['brasD']) this.cibles['brasD'] = { x: this.repos['brasD'].x + t * 0.3, y: this.repos['brasD'].y, z: this.repos['brasD'].z }

    return 0.15  // distance parcourue par ce pas
  }

  // ── Initialisation ───────────────────────────────

  initialiser(modele) {
    const index = {}
    modele.traverse(child => { index[child.name] = child })
    let trouves = 0
    for (const [cle, infos] of Object.entries(ARTICULATIONS)) {
      const os = index[infos.nom]
      if (os) {
        this.os[cle]     = os
        this.repos[cle]  = { x: os.rotation.x, y: os.rotation.y, z: os.rotation.z }
        this.cibles[cle] = { x: os.rotation.x, y: os.rotation.y, z: os.rotation.z }
        this.scores[cle] = {}
        trouves++
      }
    }
    console.log('Corps initialisé — ' + trouves + ' articulations trouvées')
  }

  // ── Repos ────────────────────────────────────────

  revenirAuRepos() {
    for (const cle of Object.keys(this.os)) {
      this.cibles[cle] = { ...this.repos[cle] }
    }
  }

  // ── Mise à jour principale ───────────────────────

  mettreAJour(cainePos, caineTorsion, enMouvement) {
    this._frameExploration++

    // Au repos — revient doucement au neutre
    if (!enMouvement) {
      if (this._frameExploration % 60 === 0) this.revenirAuRepos()
    }
    // Pendant la marche, c'est declencherPas() qui gère les jambes

    // Interpolation douce vers les cibles
    for (const [cle, os] of Object.entries(this.os)) {
      const cible = this.cibles[cle]
      if (!cible) continue
      os.rotation.x += (cible.x - os.rotation.x) * this.vitesseInterp
      os.rotation.y += (cible.y - os.rotation.y) * this.vitesseInterp
      os.rotation.z += (cible.z - os.rotation.z) * this.vitesseInterp
    }
  }
}