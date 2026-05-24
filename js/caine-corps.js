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

  // ── Marche par cycle de pas ───────────────────────

  mettreAJourMarche(frameCount) {
    const cycle  = (frameCount * 0.06) % (Math.PI * 2)
    const cycleD = (cycle + Math.PI) % (Math.PI * 2)

    const poserJambe = (phase, cle_cuisse, cle_mollet, cle_pied) => {
      const sin = Math.sin(phase)
      const estEnLevee = sin > 0

      if (this.os[cle_cuisse]) this.cibles[cle_cuisse] = {
        x: this.repos[cle_cuisse].x + sin * 0.5,
        y: this.repos[cle_cuisse].y,
        z: this.repos[cle_cuisse].z
      }
      if (this.os[cle_mollet]) this.cibles[cle_mollet] = {
        x: this.repos[cle_mollet].x + (estEnLevee ? Math.max(0, sin) * 0.8 : 0),
        y: this.repos[cle_mollet].y,
        z: this.repos[cle_mollet].z
      }
      if (this.os[cle_pied]) this.cibles[cle_pied] = {
        x: this.repos[cle_pied].x - (estEnLevee ? sin * 0.3 : 0),
        y: this.repos[cle_pied].y,
        z: this.repos[cle_pied].z
      }
    }

    poserJambe(cycle,  'cuisseG', 'molletG', 'piedG')
    poserJambe(cycleD, 'cuisseD', 'molletD', 'piedD')

    // Bras opposés
    if (this.os['brasG']) this.cibles['brasG'] = {
      x: this.repos['brasG'].x - Math.sin(cycle) * 0.3,
      y: this.repos['brasG'].y,
      z: this.repos['brasG'].z
    }
    if (this.os['brasD']) this.cibles['brasD'] = {
      x: this.repos['brasD'].x + Math.sin(cycle) * 0.3,
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
      this.mettreAJourMarche(this._frameExploration)
      const osMarche = ['cuisseG', 'cuisseD', 'molletG', 'molletD', 'piedG', 'piedD', 'brasG', 'brasD']
      for (const cle of Object.keys(this.os)) {
        if (!osMarche.includes(cle)) {
          this.cibles[cle] = { ...this.repos[cle] }
        }
      }
    }

    for (const [cle, os] of Object.entries(this.os)) {
      const cible = this.cibles[cle]
      if (!cible) continue
      os.rotation.x += (cible.x - os.rotation.x) * this.vitesseInterp
      os.rotation.y += (cible.y - os.rotation.y) * this.vitesseInterp
      os.rotation.z += (cible.z - os.rotation.z) * this.vitesseInterp
    }
  }
}