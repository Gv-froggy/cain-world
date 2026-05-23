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
    this.vitesseInterp = 0.05
    this._frameExploration = 0
  }

  // ── Geste de création ────────────────────────────

  signalerGeste(type) {
    if (type === 'empiler') {
      if (this.os['brasD']) this.cibles['brasD'] = { x: this.repos['brasD'].x - 1.4, y: this.repos['brasD'].y, z: this.repos['brasD'].z }
      if (this.os['brasG']) this.cibles['brasG'] = { x: this.repos['brasG'].x - 1.4, y: this.repos['brasG'].y, z: this.repos['brasG'].z }
      if (this.os['tete'])  this.cibles['tete']  = { x: this.repos['tete'].x - 0.3,  y: this.repos['tete'].y,  z: this.repos['tete'].z  }
    } else {
      if (this.os['brasD'])      this.cibles['brasD']      = { x: this.repos['brasD'].x + 1.2,      y: this.repos['brasD'].y,      z: this.repos['brasD'].z      }
      if (this.os['avantBrasD']) this.cibles['avantBrasD'] = { x: this.repos['avantBrasD'].x + 0.4, y: this.repos['avantBrasD'].y, z: this.repos['avantBrasD'].z }
    }
    setTimeout(() => {
      for (const cle of ['brasD', 'brasG', 'avantBrasD', 'tete']) {
        if (this.os[cle]) this.cibles[cle] = { ...this.repos[cle] }
      }
    }, 1000)
  }

  // ── Marche sinusoïdale ───────────────────────────

  mettreAJourMarche(frameCount) {
    const t = frameCount * 0.06
    const amp = 0.4

    // Cuisses — avant/arrière sur X
    if (this.os['cuisseG']) this.cibles['cuisseG'] = {
      x: this.repos['cuisseG'].x + Math.sin(t) * amp,
      y: this.repos['cuisseG'].y,
      z: this.repos['cuisseG'].z
    }
    if (this.os['cuisseD']) this.cibles['cuisseD'] = {
      x: this.repos['cuisseD'].x - Math.sin(t) * amp,
      y: this.repos['cuisseD'].y,
      z: this.repos['cuisseD'].z
    }

    // Mollets — bloqués au repos pour éviter les glitchs
    if (this.os['molletG']) this.cibles['molletG'] = { ...this.repos['molletG'] }
    if (this.os['molletD']) this.cibles['molletD'] = { ...this.repos['molletD'] }

    // Pieds — restent plats
    if (this.os['piedG']) this.cibles['piedG'] = { ...this.repos['piedG'] }
    if (this.os['piedD']) this.cibles['piedD'] = { ...this.repos['piedD'] }

    // Bras opposés aux cuisses
    if (this.os['brasG']) this.cibles['brasG'] = {
      x: this.repos['brasG'].x - Math.sin(t) * 0.3,
      y: this.repos['brasG'].y,
      z: this.repos['brasG'].z
    }
    if (this.os['brasD']) this.cibles['brasD'] = {
      x: this.repos['brasD'].x + Math.sin(t) * 0.3,
      y: this.repos['brasD'].y,
      z: this.repos['brasD'].z
    }
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

    if (!enMouvement) {
      if (this._frameExploration % 60 === 0) this.revenirAuRepos()
    } else {
      // Marche sinusoïdale
      this.mettreAJourMarche(this._frameExploration)
      // Tronc et tête restent au repos pendant la marche
      const osMarche = ['cuisseG', 'cuisseD', 'molletG', 'molletD', 'piedG', 'piedD', 'brasG', 'brasD']
      for (const cle of Object.keys(this.os)) {
        if (!osMarche.includes(cle)) {
          this.cibles[cle] = { ...this.repos[cle] }
        }
      }
    }

    // Interpolation douce
    for (const [cle, os] of Object.entries(this.os)) {
      const cible = this.cibles[cle]
      if (!cible) continue
      os.rotation.x += (cible.x - os.rotation.x) * this.vitesseInterp
      os.rotation.y += (cible.y - os.rotation.y) * this.vitesseInterp
      os.rotation.z += (cible.z - os.rotation.z) * this.vitesseInterp
    }
  }
}