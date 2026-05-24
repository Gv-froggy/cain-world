import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { demanderDecision } from './caine-llm.js'
import { GestionnaireCorps } from './caine-corps.js'
import { MemoireEpisodique } from './caine-memoire.js'

// ============================================
// MONDE
// ============================================

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 8, 14)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

// ============================================
// SOL EN DAMIER
// ============================================

const textureSize = 8
const canvas2d = document.createElement('canvas')
canvas2d.width = textureSize * 2
canvas2d.height = textureSize * 2
const ctx = canvas2d.getContext('2d')
for (let x = 0; x < 2; x++) {
  for (let y = 0; y < 2; y++) {
    ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#000000'
    ctx.fillRect(x * textureSize, y * textureSize, textureSize, textureSize)
  }
}
const checkerTexture = new THREE.CanvasTexture(canvas2d)
checkerTexture.wrapS = THREE.RepeatWrapping
checkerTexture.wrapT = THREE.RepeatWrapping
checkerTexture.repeat.set(20, 20)

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ map: checkerTexture })
)
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

// ============================================
// LUMIERES
// ============================================

scene.add(new THREE.AmbientLight(0xffffff, 0.6))
const light = new THREE.DirectionalLight(0xffffff, 0)
light.position.set(5, 10, 5)
light.castShadow = true
light.shadow.radius = 4
light.shadow.bias = -0.001
scene.add(light)
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// ============================================
// OBJETS
// ============================================

const FORMES = {
  CUBE: 'cube', SPHERE: 'sphere', CYLINDRE: 'cylindre', CONE: 'cone', TORE: 'tore'
}

const INFOS_FORMES = {
  cube:     { demiHauteur: 0.5 },
  sphere:   { demiHauteur: 0.5 },
  cylindre: { demiHauteur: 0.5 },
  cone:     { demiHauteur: 0.6 },
  tore:     { demiHauteur: 0.15 }
}

const PALETTE = [
  0xe74c3c, 0xe74c3c, 0xe74c3c,
  0x3498db, 0x2ecc71, 0xf39c12,
  0x9b59b6, 0xe91e63, 0x1abc9c, 0xf1c40f,
]

const NOMS_COULEURS = {
  [0xe74c3c]: 'rouge', [0x3498db]: 'bleu', [0x2ecc71]: 'vert',
  [0xf39c12]: 'orange', [0x9b59b6]: 'violet', [0xe91e63]: 'rose',
  [0x1abc9c]: 'turquoise', [0xf1c40f]: 'jaune'
}

const HAUTEUR_MAX_PILE = 5
const MAX_OBJETS = 45

function creerGeometrie(forme) {
  switch(forme) {
    case FORMES.CUBE:     return new THREE.BoxGeometry(1, 1, 1)
    case FORMES.SPHERE:   return new THREE.SphereGeometry(0.5, 16, 16)
    case FORMES.CYLINDRE: return new THREE.CylinderGeometry(0.4, 0.4, 1, 16)
    case FORMES.CONE:     return new THREE.ConeGeometry(0.5, 1.2, 16)
    case FORMES.TORE:     return new THREE.TorusGeometry(0.4, 0.15, 12, 24)
    default:              return new THREE.BoxGeometry(1, 1, 1)
  }
}

const objetsCollidables = []

function creerObjet(forme, x, y, z, couleur) {
  const objet = new THREE.Mesh(
    creerGeometrie(forme),
    new THREE.MeshStandardMaterial({ color: couleur })
  )
  objet.position.set(x, y, z)
  objet.castShadow = true
  objet.receiveShadow = true
  objet.rayonCollision = 0.6
  objet.couleurOriginale = couleur
  objet.forme = forme
  objet.rotation.y = Math.random() * Math.PI * 2
  objet.rotation.x = (Math.random() - 0.5) * 0.15
  objet.rotation.z = (Math.random() - 0.5) * 0.15
  scene.add(objet)
  objetsCollidables.push(objet)
  return objet
}

function choisirAuHasard(tableau) {
  return tableau[Math.floor(Math.random() * tableau.length)]
}

// ============================================
// PILES
// ============================================

const piles = []

function trouverPileProche(x, z, rayon) {
  for (const pile of piles) {
    const dx = pile.x - x
    const dz = pile.z - z
    if (Math.sqrt(dx * dx + dz * dz) < rayon) return pile
  }
  return null
}

function calculerSommetPile(pile) {
  let sommet = 0
  for (const objet of pile.objets) {
    const s = objet.position.y + INFOS_FORMES[objet.forme].demiHauteur
    if (s > sommet) sommet = s
  }
  return sommet
}

function poserObjet(forme, x, z, couleur) {
  const demi = INFOS_FORMES[forme].demiHauteur
  const posX = x + (Math.random() - 0.5) * 0.3
  const posZ = z + (Math.random() - 0.5) * 0.3
  const pileExistante = trouverPileProche(posX, posZ, 0.8)
  if (pileExistante && pileExistante.objets.length < HAUTEUR_MAX_PILE) {
    const objet = creerObjet(forme, posX, calculerSommetPile(pileExistante) + demi, posZ, couleur)
    pileExistante.objets.push(objet)
    return { objet, empile: true, hauteur: pileExistante.objets.length }
  } else if (!pileExistante) {
    const objet = creerObjet(forme, posX, demi, posZ, couleur)
    piles.push({ x: posX, z: posZ, objets: [objet] })
    return { objet, empile: false, hauteur: 1 }
  }
  return null
}

// ============================================
// MEMOIRE
// ============================================

const memoire = {
  creations: [],
  episodique: new MemoireEpisodique()
}

// ============================================
// CARTE MENTALE — allégée
// ============================================

const carte = {
  taille: 8, cellule: 5,
  densite:   new Array(64).fill(0),
  visites:   new Array(64).fill(0),

  index(x, z) {
    const gx = Math.max(0, Math.min(7, Math.floor((x + 20) / this.cellule)))
    const gz = Math.max(0, Math.min(7, Math.floor((z + 20) / this.cellule)))
    return gz * 8 + gx
  },
  noterCreation(x, z) { this.densite[this.index(x, z)]++ },
  noterVisite(x, z)   { this.visites[this.index(x, z)]++ },
  interet(idx) { return 10 - this.densite[idx] * 0.5 - this.visites[idx] * 0.1 },
  meilleureDestination() {
    let best = 0, bestScore = -Infinity
    for (let i = 0; i < 64; i++) {
      const s = this.interet(i)
      if (s > bestScore) { bestScore = s; best = i }
    }
    const gz = Math.floor(best / 8), gx = best % 8
    return {
      x: (gx * this.cellule - 20) + this.cellule / 2,
      z: (gz * this.cellule - 20) + this.cellule / 2
    }
  }
}

// ============================================
// OBJETS INITIAUX
// ============================================

creerObjet(FORMES.CUBE,     -5, 0.5,  3, 0xe74c3c)
creerObjet(FORMES.SPHERE,    4, 0.5, -4, 0x3498db)
creerObjet(FORMES.CONE,     -3, 0.6, -6, 0x2ecc71)
creerObjet(FORMES.TORE,      6, 0.4,  5, 0xf39c12)
creerObjet(FORMES.CYLINDRE,  2, 0.5,  7, 0xe91e63)

// ============================================
// CAINE
// ============================================

const caine = new THREE.Object3D()
caine.position.y = 1
scene.add(caine)

const corps = new GestionnaireCorps()

const caineTemp = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 2, 16),
  new THREE.MeshStandardMaterial({ color: 0x9b59b6 })
)
caine.add(caineTemp)

const loader = new GLTFLoader()
loader.load('./caine/caine.glb', (gltf) => {
  caine.remove(caineTemp)
  caineTemp.geometry.dispose()
  const modele = gltf.scene
  modele.scale.set(1.5, 1.5, 1.5)
  modele.position.set(0, -1, 0)
  modele.traverse((child) => {
    if (child.isMesh) { child.castShadow = true; child.receiveShadow = true }
  })
  caine.add(modele)
  corps.initialiser(modele)
  console.log('Modele de Caine charge !')
}, undefined, (error) => console.log('Erreur : ' + error))

const RAYON_CAINE = 0.5

// ============================================
// CONE DE VISION
// ============================================

function creerConeVision() {
  const groupe = new THREE.Group()
  const av = Math.PI / 3

  const geoN = new THREE.BufferGeometry()
  const ptsN = [0, 0, 0]
  for (let i = 0; i <= 20; i++) {
    const a = -av + (i / 20) * av * 2
    ptsN.push(Math.sin(a) * 4, 0, Math.cos(a) * 4)
  }
  geoN.setAttribute('position', new THREE.Float32BufferAttribute(ptsN, 3))
  const idxN = []
  for (let i = 1; i <= 20; i++) idxN.push(0, i, i + 1)
  geoN.setIndex(idxN)
  groupe.add(new THREE.Mesh(geoN, new THREE.MeshBasicMaterial({
    color: 0x00ff88, transparent: true, opacity: 0.08, side: THREE.DoubleSide
  })))

  const geoF = new THREE.BufferGeometry()
  const ptsF = []
  for (let i = 0; i <= 20; i++) {
    const a = -av + (i / 20) * av * 2
    ptsF.push(Math.sin(a) * 4, 0, Math.cos(a) * 4)
    }
  for (let i = 0; i <= 20; i++) {
    const a = -av + (i / 20) * av * 2
    ptsF.push(Math.sin(a) * 10, 0, Math.cos(a) * 10)
  }
  geoF.setAttribute('position', new THREE.Float32BufferAttribute(ptsF, 3))
  const idxF = []
  for (let i = 0; i < 20; i++) {
    idxF.push(i, i + 1, 21 + i)
    idxF.push(i + 1, 21 + i + 1, 21 + i)
  }
  geoF.setIndex(idxF)
  groupe.add(new THREE.Mesh(geoF, new THREE.MeshBasicMaterial({
    color: 0xffff00, transparent: true, opacity: 0.05, side: THREE.DoubleSide
  })))

  groupe.position.y = 0.05
  scene.add(groupe)
  return groupe
}

const coneVision = creerConeVision()

// ============================================
// MINI CARTE 2D
// ============================================

const miniCarte = document.createElement('canvas')
miniCarte.width = 200
miniCarte.height = 200
miniCarte.style.cssText = `
  position: fixed; top: 16px; right: 16px;
  border-radius: 8px; border: 1px solid #9b59b6;
  background: rgba(0,0,0,0.5);
`
document.body.appendChild(miniCarte)
const ctxCarte = miniCarte.getContext('2d')

function mettreAJourMiniCarte() {
  if (frameCount % 30 !== 0) return
  ctxCarte.clearRect(0, 0, 200, 200)
  for (let i = 0; i < 64; i++) {
    const gz = Math.floor(i / 8), gx = i % 8
    const t = Math.max(0, Math.min(1, (carte.interet(i) + 6) / 16))
    ctxCarte.fillStyle = 'rgb(' + Math.floor((1-t)*180) + ',' + Math.floor(t*180) + ',0)'
    ctxCarte.fillRect(gx * 25, gz * 25, 24, 24)
  }
  for (const objet of objetsCollidables) {
    const ox = ((objet.position.x + 20) / 40) * 200
    const oz = ((objet.position.z + 20) / 40) * 200
    const c = new THREE.Color(objet.couleurOriginale)
    ctxCarte.fillStyle = 'rgb(' + Math.floor(c.r*255) + ',' + Math.floor(c.g*255) + ',' + Math.floor(c.b*255) + ')'
    ctxCarte.beginPath()
    ctxCarte.arc(ox, oz, 2, 0, Math.PI * 2)
    ctxCarte.fill()
  }
  const cx = ((caine.position.x + 20) / 40) * 200
  const cz = ((caine.position.z + 20) / 40) * 200
  ctxCarte.fillStyle = '#9b59b6'
  ctxCarte.beginPath()
  ctxCarte.arc(cx, cz, 5, 0, Math.PI * 2)
  ctxCarte.fill()
}

// ============================================
// VISION
// ============================================

const ZONES = { HORS_VUE: 'hors_vue', FLOUE: 'floue', NETTE: 'nette', CONTACT: 'contact' }
const raycaster = new THREE.Raycaster()
let frameCount = 0
let derniereScan = { objet: null, zone: ZONES.HORS_VUE, distance: Infinity }

function calculerZoneVision(objet) {
  const dx = objet.position.x - caine.position.x
  const dz = objet.position.z - caine.position.z
  const distance = Math.sqrt(dx * dx + dz * dz)
  if (distance > 10) return { zone: ZONES.HORS_VUE, distance }
  let angleDiff = Math.atan2(dx, dz) - caine.rotation.y
  while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
  if (Math.abs(angleDiff) > Math.PI / 3) return { zone: ZONES.HORS_VUE, distance }
  raycaster.set(
    new THREE.Vector3(caine.position.x, 1.5, caine.position.z),
    new THREE.Vector3(dx, 0, dz).normalize()
  )
  const hits = raycaster.intersectObjects(objetsCollidables.filter(o => o !== objet))
  if (hits.length > 0 && hits[0].distance < distance) return { zone: ZONES.HORS_VUE, distance }
  if (distance <= 1)  return { zone: ZONES.CONTACT, distance }
  if (distance <= 4)  return { zone: ZONES.NETTE,   distance }
  return { zone: ZONES.FLOUE, distance }
}

function scannerEnvironnement() {
  frameCount++
  if (frameCount % 3 !== 0) return derniereScan
  let objetProche = null, distMin = Infinity, zoneProche = ZONES.HORS_VUE
  for (const objet of objetsCollidables) {
    const dx = objet.position.x - caine.position.x
    const dz = objet.position.z - caine.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist > 10) continue
    const { zone } = calculerZoneVision(objet)
    if (zone !== ZONES.HORS_VUE && dist < distMin) {
      distMin = dist; objetProche = objet; zoneProche = zone
    }
  }
  derniereScan = { objet: objetProche, zone: zoneProche, distance: distMin }
  return derniereScan
}

// ============================================
// COLLISION
// ============================================

function detecterCollision(pos) {
  for (const objet of objetsCollidables) {
    const dx = pos.x - objet.position.x
    const dz = pos.z - objet.position.z
    if (Math.sqrt(dx * dx + dz * dz) < RAYON_CAINE + objet.rayonCollision) return objet
  }
  return null
}

function calculerContournement(obs) {
  const angle = Math.atan2(caine.position.z - obs.position.z, caine.position.x - obs.position.x)
  const sens = Math.random() > 0.5 ? 1 : -1
  const r = RAYON_CAINE + obs.rayonCollision + 0.5
  return new THREE.Vector3(
    obs.position.x + Math.cos(angle + Math.PI / 2 * sens) * r,
    1,
    obs.position.z + Math.sin(angle + Math.PI / 2 * sens) * r
  )
}

// ============================================
// CREATION ET SUPPRESSION
// ============================================

function supprimerObjet() {
  if (memoire.creations.length === 0) return

  // Filtre uniquement les objets à portée (1.5m max)
  const aPortee = memoire.creations.filter(c => {
    const dx = c.position.x - caine.position.x
    const dz = c.position.z - caine.position.z
    return Math.sqrt(dx * dx + dz * dz) <= 1.5
  })

  // Si rien à portée, Caine ne supprime pas
  if (aPortee.length === 0) {
    console.log('Caine veut supprimer mais rien à portée...')
    cerveau.etat = ETATS.CHOISIR
    return
  }

  const idx = Math.floor(Math.random() * aPortee.length)
  const cible = aPortee[idx]
  scene.remove(cible.objet)
  cible.objet.geometry.dispose()
  cible.objet.material.dispose()
  const icMem = memoire.creations.indexOf(cible)
  if (icMem > -1) memoire.creations.splice(icMem, 1)
  const ic = objetsCollidables.indexOf(cible.objet)
  if (ic > -1) objetsCollidables.splice(ic, 1)
  for (const pile of piles) {
    const ip = pile.objets.indexOf(cible.objet)
    if (ip > -1) { pile.objets.splice(ip, 1); break }
  }
  for (let i = piles.length - 1; i >= 0; i--) {
    if (piles[i].objets.length === 0) piles.splice(i, 1)
  }
}

function caineCreer() {
  while (memoire.creations.length >= MAX_OBJETS) supprimerObjet()

  const forme   = choisirAuHasard(Object.values(FORMES))
  const couleur = choisirAuHasard(PALETTE)

  // Cherche une pile proche sur laquelle empiler
  const pileProche = trouverPileProche(caine.position.x, caine.position.z, 2.0)
  const peutEmpiler = pileProche && pileProche.objets.length < HAUTEUR_MAX_PILE

  let x, z
  if (peutEmpiler) {
    // Vise exactement la pile existante
    x = pileProche.x
    z = pileProche.z
  } else {
    // Pose devant lui normalement
    x = caine.position.x + Math.sin(caine.rotation.y) * 1.8
    z = caine.position.z + Math.cos(caine.rotation.y) * 1.8
  }

  const dejaCree = memoire.creations.some(c => {
    const dx = c.position.x - x, dz = c.position.z - z
    return Math.sqrt(dx * dx + dz * dz) < 0.8
  })
  if (dejaCree && !peutEmpiler) { cerveau.etat = ETATS.CHOISIR; return false }

  const resultat = poserObjet(forme, x, z, couleur)
  if (resultat) {
    const { objet, empile, hauteur } = resultat
    memoire.creations.push({
      forme, couleur,
      position: { x: objet.position.x, y: objet.position.y, z: objet.position.z },
      objet, age: 0
    })
    carte.noterCreation(objet.position.x, objet.position.z)

    // Signale au corps quel geste faire
    cerveau.geste = empile ? 'empiler' : 'poser'

    const nomCouleur = NOMS_COULEURS[couleur] || 'coloré'
    if (empile && hauteur >= 3) {
      memoire.episodique.ajouter('creation',
        'j\'ai terminé une pile de ' + hauteur + ' étages avec un ' + nomCouleur + ' ' + forme, 3)
    } else if (empile) {
      memoire.episodique.ajouter('creation',
        'j\'ai empilé un ' + nomCouleur + ' ' + forme + ' (pile de ' + hauteur + ')', 2)
    } else {
      memoire.episodique.ajouter('creation',
        'j\'ai posé un ' + nomCouleur + ' ' + forme, 1)
    }
    return true
  }
  return false
}

// ============================================
// CERVEAU
// ============================================

const ETATS = {
  CHOISIR: 'choisir', MARCHER: 'marcher', CONTOURNER: 'contourner',
  ENQUETER: 'enqueter', EXAMINER: 'examiner', CREER: 'creer', OBSERVER: 'observer'
}

const cerveau = {
  etat:              ETATS.CHOISIR,
  destination:       new THREE.Vector3(),
  destinationFinale: new THREE.Vector3(),
  vitesse:           0.05,
  tempsAttente:      0,
  dureeAttente:      0,
  cible:             null,
  perception:        { objet: null, zone: ZONES.HORS_VUE, distance: Infinity },
  geste:             'poser'
}

// ============================================
// LLM
// ============================================

const llm = {
  actif:            false,
  enCours:          false,
  penseeActuelle:   "je m'éveille...",
  humeurActuelle:   'curieux',
  dernieresActions: [],
  intervalleFrames: 180
}

async function consulterLLM() {
  if (llm.enCours) return
  llm.enCours = true

  const p = cerveau.perception
  const hauteurMaxPile = piles.length > 0 ? Math.max(...piles.map(p => p.objets.length)) : 0

  const etatMonde = {
    nbCreations:      memoire.creations.length,
    maxObjets:        MAX_OBJETS,
    nbPiles:          piles.length,
    hauteurMaxPile,
    objetVu:          p.objet ? p.objet.forme : 'rien',
    zoneVision:       p.zone,
    distanceObjet:    p.distance === Infinity ? '—' : p.distance.toFixed(1) + 'm',
    etatActuel:       cerveau.etat,
    humeurActuelle:   llm.humeurActuelle,
    dernieresActions: llm.dernieresActions,
    scoresMeilleurs:  '',
    souvenirs:        memoire.episodique.resumePourLLM()  // ← mémoire épisodique
  }

  const decision = await demanderDecision(etatMonde)
  if (decision) {
    llm.actif          = true
    llm.penseeActuelle = decision.pensee
    llm.humeurActuelle = decision.humeur
    llm.dernieresActions.push(decision.action)
    if (llm.dernieresActions.length > 8) llm.dernieresActions.shift()
    if (cerveau.etat === ETATS.CHOISIR || cerveau.etat === ETATS.OBSERVER) {
      appliquerDecisionLLM(decision.action)
    }
    console.log('🧠 "' + decision.pensee + '" → ' + decision.action)
  }
  llm.enCours = false
}

function appliquerDecisionLLM(action) {
  switch(action) {
    case 'empiler':
      if (piles.length > 0) {
        const p = piles.filter(p => p.objets.length < HAUTEUR_MAX_PILE)
        if (p.length > 0) {
          const cible = p.reduce((max, p) => p.objets.length > max.objets.length ? p : max)
          cerveau.destination.set(cible.x, 1, cible.z)
          cerveau.destinationFinale.set(cible.x, 1, cible.z)
          cerveau.etat = ETATS.MARCHER
          return
        }
      }
      cerveau.etat = ETATS.CHOISIR
      break
    case 'explorer': cerveau.etat = ETATS.CHOISIR; break
    case 'creer':    cerveau.etat = ETATS.CREER;   break
    case 'examiner':
      if (cerveau.perception.objet) {
        cerveau.cible        = cerveau.perception.objet
        cerveau.etat         = ETATS.EXAMINER
        cerveau.tempsAttente = 0
        cerveau.dureeAttente = 120
      }
      break
    case 'supprimer': supprimerObjet(); cerveau.etat = ETATS.CHOISIR; break
  }
}

// ============================================
// LOGIQUE CERVEAU
// ============================================

function choisirDestination() {
  // Choix simple sans système de scores — 70% carte mentale, 30% aléatoire
  let destX, destZ
  if (Math.random() < 0.7 && memoire.creations.length > 3) {
    const dest = carte.meilleureDestination()
    destX = dest.x + (Math.random() - 0.5) * 4
    destZ = dest.z + (Math.random() - 0.5) * 4
  } else {
    destX = (Math.random() - 0.5) * 30
    destZ = (Math.random() - 0.5) * 30
  }
  cerveau.destination.set(destX, 1, destZ)
  cerveau.destinationFinale.set(destX, 1, destZ)
  cerveau.cible = null
  cerveau.etat = ETATS.MARCHER
}

// État de marche — vitesse progressive et cycle de pas
const marche = {
  vitesseActuelle: 0,
  vitesseMax:      0.07,
  acceleration:    0.003,
  deceleration:    0.006,
  phasePas:        0,        // 0 à 1 — cycle complet d'un pas
  dureePas:        0.4,      // secondes par pas
  distancePas:     0,        // distance accumulée depuis le dernier pas
  seuilPas:        0.3,      // distance pour déclencher un "vrai" pas
}

function deplacerVerDestination(destination) {
  const direction = new THREE.Vector3()
  direction.subVectors(destination, caine.position)
  const distanceRestante = direction.length()

  if (distanceRestante > 0.2) {
    direction.normalize()

// La vitesse est proportionnelle à l'oscillation des jambes
    // Math.abs(sin) va de 0 à 1 selon la phase du cycle
    const phaseMarche = Math.abs(Math.sin(corps._frameExploration * 0.06))
   // Avance seulement quand un pied pousse — phase d'appui
    const cycleG = Math.sin(corps._frameExploration * 0.06)
    const cycleD = Math.sin(corps._frameExploration * 0.06 + Math.PI)
    const poussee = Math.max(0, -cycleG) + Math.max(0, -cycleD)
    marche.vitesseActuelle = marche.vitesseMax * poussee * 0.6
    const next = new THREE.Vector3(
      caine.position.x + direction.x * marche.vitesseActuelle,
      1,
      caine.position.z + direction.z * marche.vitesseActuelle
    )

    const obstacle = detecterCollision(next)
    if (obstacle) {
      marche.vitesseActuelle = 0
      if (Math.random() > 0.5) {
        cerveau.destination = calculerContournement(obstacle)
        cerveau.etat = ETATS.CONTOURNER
      } else {
        cerveau.etat = ETATS.CHOISIR
      }
    } else {
      caine.position.x = next.x
      caine.position.z = next.z
      caine.rotation.y = Math.atan2(direction.x, direction.z)
    }
    return false
  }
  marche.vitesseActuelle = 0
  return true
}

function mettreAJourCerveau() {
  if (frameCount % llm.intervalleFrames === 0) consulterLLM()

  cerveau.perception = scannerEnvironnement()

  coneVision.position.copy(caine.position)
  coneVision.position.y = 0.05
  coneVision.rotation.y = caine.rotation.y

  if (frameCount % 60 === 0) carte.noterVisite(caine.position.x, caine.position.z)
  mettreAJourMiniCarte()

  if (cerveau.etat === ETATS.CHOISIR) {
    choisirDestination()
  }
  else if (cerveau.etat === ETATS.MARCHER) {
  if (cerveau.perception.objet && cerveau.perception.zone === ZONES.FLOUE && Math.random() < 0.003) {
    cerveau.cible = cerveau.perception.objet
    cerveau.destination.copy(cerveau.cible.position)
    cerveau.destinationFinale.copy(cerveau.cible.position)
    cerveau.etat = ETATS.ENQUETER
  }
  const arrive = deplacerVerDestination(cerveau.destination)
  if (arrive) cerveau.etat = ETATS.CREER
}
  else if (cerveau.etat === ETATS.ENQUETER) {
    const arrive = deplacerVerDestination(cerveau.destination)
    if (cerveau.perception.zone === ZONES.CONTACT || arrive) {
      cerveau.etat = ETATS.EXAMINER
      cerveau.tempsAttente = 0
      cerveau.dureeAttente = Math.random() * 150 + 100
      if (cerveau.cible) {
        const nomCouleur = NOMS_COULEURS[cerveau.cible.couleurOriginale] || 'coloré'
        memoire.episodique.ajouter('observation',
          'j\'ai observé un ' + nomCouleur + ' ' + cerveau.cible.forme + ' de près', 2)
      }
    }
  }
  else if (cerveau.etat === ETATS.CONTOURNER) {
    const arrive = deplacerVerDestination(cerveau.destination)
    if (arrive) {
      cerveau.destination.copy(cerveau.destinationFinale)
      cerveau.etat = ETATS.MARCHER
    }
  }
  else if (cerveau.etat === ETATS.EXAMINER) {
    caine.rotation.y += 0.02
    cerveau.tempsAttente++
    if (cerveau.tempsAttente >= cerveau.dureeAttente) cerveau.etat = ETATS.CREER
  }
  else if (cerveau.etat === ETATS.CREER) {
    caineCreer()
    corps.signalerGeste(cerveau.geste)
    cerveau.etat = ETATS.OBSERVER
    cerveau.tempsAttente = 0
    cerveau.dureeAttente = Math.random() * 300 + 200
  }
  else if (cerveau.etat === ETATS.OBSERVER) {
    cerveau.tempsAttente++
    for (const creation of memoire.creations) creation.age++
    if (cerveau.tempsAttente >= cerveau.dureeAttente) {
      if (memoire.creations.length >= MAX_OBJETS) supprimerObjet()
      cerveau.etat = ETATS.CHOISIR
    }
  }

  const enMouvement = cerveau.etat === ETATS.MARCHER || cerveau.etat === ETATS.ENQUETER
  corps.mettreAJour({ x: caine.position.x, z: caine.position.z }, caine.rotation.x, enMouvement)
}

// ============================================
// INTERFACE
// ============================================

const ui = document.createElement('div')
ui.style.cssText = `
  position: fixed; top: 16px; left: 16px;
  color: #ffffff; font-family: monospace; font-size: 13px;
  background: rgba(0,0,0,0.5); padding: 10px 14px;
  border-radius: 8px; border-left: 3px solid #9b59b6;
  pointer-events: none; line-height: 1.8; max-width: 280px;
`
document.body.appendChild(ui)

function mettreAJourUI() {
  const p = cerveau.perception
  const objetVu = p.objet ? p.objet.forme : 'rien'
  const distanceVue = p.distance === Infinity ? '—' : p.distance.toFixed(1) + 'm'
  const hauteurMaxPile = piles.length > 0 ? Math.max(...piles.map(p => p.objets.length)) : 0

  // Dernier souvenir
  const dernierSouvenir = memoire.episodique.souvenirs[0]
  const souvenirAffiche = dernierSouvenir
    ? '<span style="color:#aaa;font-size:11px">' + dernierSouvenir.description + '</span>'
    : '<span style="color:#555;font-size:11px">aucun souvenir</span>'

  ui.innerHTML =
    '<b style="color:#9b59b6">CAINE</b><br>' +
    'Etat : ' + cerveau.etat + '<br>' +
    '<i style="color:#1abc9c">"' + llm.penseeActuelle + '"</i><br>' +
    'humeur : ' + llm.humeurActuelle +
    (llm.actif ? '' : ' <span style="color:#555;font-size:10px">(Ollama...)</span>') + '<br>' +
    'Voit : ' + objetVu + ' (' + p.zone + ')<br>' +
    'Distance : ' + distanceVue + '<br>' +
    'Creations : ' + memoire.creations.length + '/' + MAX_OBJETS + '<br>' +
    'Piles : ' + piles.length + ' (max ' + hauteurMaxPile + ' etages)<br>' +
    '<br><b style="color:#f39c12">DERNIER SOUVENIR</b><br>' +
    souvenirAffiche + '<br>'
}

// ============================================
// BOUCLE
// ============================================

function animate() {
  requestAnimationFrame(animate)
  mettreAJourCerveau()
  mettreAJourUI()
  renderer.render(scene, camera)
}

animate()