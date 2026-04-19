import * as THREE from './node_modules/three/build/three.module.js'

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

scene.add(new THREE.AmbientLight(0xffffff, 0.4))
const pointLight = new THREE.PointLight(0xffffff, 80)
pointLight.position.set(5, 8, 5)
pointLight.castShadow = true
scene.add(pointLight)

// ============================================
// BIBLIOTHEQUE D'OBJETS
// ============================================

const FORMES = {
  CUBE:     'cube',
  SPHERE:   'sphere',
  CYLINDRE: 'cylindre',
  CONE:     'cone',
  TORE:     'tore'
}

const INFOS_FORMES = {
  cube:     { hauteur: 1.0, demiHauteur: 0.5 },
  sphere:   { hauteur: 1.0, demiHauteur: 0.5 },
  cylindre: { hauteur: 1.0, demiHauteur: 0.5 },
  cone:     { hauteur: 1.2, demiHauteur: 0.6 },
  tore:     { hauteur: 0.3, demiHauteur: 0.15 }
}

const PALETTE = [
  0xe74c3c,
  0xe74c3c,
  0xe74c3c,
  0x3498db,
  0x2ecc71,
  0xf39c12,
  0x9b59b6,
  0xe91e63,
  0x1abc9c,
  0xf1c40f,
]

const HAUTEUR_MAX_PILE = 3
const MAX_OBJETS = 40

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
  const geometry = creerGeometrie(forme)
  const material = new THREE.MeshStandardMaterial({ color: couleur })
  const objet = new THREE.Mesh(geometry, material)
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
// SYSTEME DE PILES
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
    const infos = INFOS_FORMES[objet.forme]
    const sommetObjet = objet.position.y + infos.demiHauteur
    if (sommetObjet > sommet) sommet = sommetObjet
  }
  return sommet
}

function poserObjet(forme, x, z, couleur) {
  const infos = INFOS_FORMES[forme]
  const decalageX = (Math.random() - 0.5) * 0.4
  const decalageZ = (Math.random() - 0.5) * 0.4
  const posX = x + decalageX
  const posZ = z + decalageZ
  const pileExistante = trouverPileProche(posX, posZ, 1.5)

  if (pileExistante && pileExistante.objets.length < HAUTEUR_MAX_PILE) {
    const sommet = calculerSommetPile(pileExistante)
    const y = sommet + infos.demiHauteur
    const objet = creerObjet(forme, posX, y, posZ, couleur)
    pileExistante.objets.push(objet)
    console.log('Caine empile ! Pile de ' + pileExistante.objets.length + ' objets')
    return objet
  } else if (!pileExistante) {
    const y = infos.demiHauteur
    const objet = creerObjet(forme, posX, y, posZ, couleur)
    piles.push({ x: posX, z: posZ, objets: [objet] })
    console.log('Caine commence une nouvelle pile !')
    return objet
  }

  console.log('Pile trop haute, Caine cherche ailleurs...')
  return null
}

// ============================================
// MEMOIRE DE CAINE
// ============================================

const memoire = {
  creations: []
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

const caine = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 2, 16),
  new THREE.MeshStandardMaterial({ color: 0x9b59b6 })
)
caine.position.y = 1
caine.castShadow = true
scene.add(caine)

const RAYON_CAINE = 0.5

// ============================================
// CONE DE VISION
// ============================================

function creerConeVision() {
  const groupe = new THREE.Group()
  const angleVision = Math.PI / 3

  const geoNette = new THREE.BufferGeometry()
  const pointsNette = []
  pointsNette.push(0, 0, 0)
  for (let i = 0; i <= 20; i++) {
    const a = -angleVision + (i / 20) * angleVision * 2
    pointsNette.push(Math.sin(a) * 4, 0, Math.cos(a) * 4)
  }
  geoNette.setAttribute('position', new THREE.Float32BufferAttribute(pointsNette, 3))
  const indices = []
  for (let i = 1; i <= 20; i++) indices.push(0, i, i + 1)
  geoNette.setIndex(indices)
  groupe.add(new THREE.Mesh(geoNette, new THREE.MeshBasicMaterial({
    color: 0x00ff88, transparent: true, opacity: 0.08, side: THREE.DoubleSide
  })))

  const geoFloue = new THREE.BufferGeometry()
  const pointsFloue = []
  for (let i = 0; i <= 20; i++) {
    const a = -angleVision + (i / 20) * angleVision * 2
    pointsFloue.push(Math.sin(a) * 4, 0, Math.cos(a) * 4)
  }
  for (let i = 0; i <= 20; i++) {
    const a = -angleVision + (i / 20) * angleVision * 2
    pointsFloue.push(Math.sin(a) * 10, 0, Math.cos(a) * 10)
  }
  geoFloue.setAttribute('position', new THREE.Float32BufferAttribute(pointsFloue, 3))
  const indicesFloue = []
  for (let i = 0; i < 20; i++) {
    indicesFloue.push(i, i + 1, 21 + i)
    indicesFloue.push(i + 1, 21 + i + 1, 21 + i)
  }
  geoFloue.setIndex(indicesFloue)
  groupe.add(new THREE.Mesh(geoFloue, new THREE.MeshBasicMaterial({
    color: 0xffff00, transparent: true, opacity: 0.05, side: THREE.DoubleSide
  })))

  groupe.position.y = 0.05
  scene.add(groupe)
  return groupe
}

const coneVision = creerConeVision()

// ============================================
// SYSTEME DE VISION
// ============================================

const ZONES = {
  HORS_VUE: 'hors_vue',
  FLOUE:    'floue',
  NETTE:    'nette',
  CONTACT:  'contact'
}

// Raycaster créé une seule fois ici — pas à chaque frame
const raycaster = new THREE.Raycaster()

function calculerZoneVision(objet) {
  const dx = objet.position.x - caine.position.x
  const dz = objet.position.z - caine.position.z
  const distance = Math.sqrt(dx * dx + dz * dz)
  if (distance > 10) return { zone: ZONES.HORS_VUE, distance }

  const angleObjet  = Math.atan2(dx, dz)
  const angleRegard = caine.rotation.y
  let angleDiff = angleObjet - angleRegard
  while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
  if (Math.abs(angleDiff) > Math.PI / 3) return { zone: ZONES.HORS_VUE, distance }

  // Lance un rayon depuis les yeux de Caine vers l'objet
  const origine = new THREE.Vector3(caine.position.x, 1.5, caine.position.z)
  const direction = new THREE.Vector3(dx, 0, dz).normalize()
  raycaster.set(origine, direction)

  // Si un obstacle bloque la vue → objet caché
  const obstacles = objetsCollidables.filter(o => o !== objet)
  const intersections = raycaster.intersectObjects(obstacles)
  if (intersections.length > 0 && intersections[0].distance < distance) {
    return { zone: ZONES.HORS_VUE, distance }
  }

  if (distance <= 1)  return { zone: ZONES.CONTACT, distance }
  if (distance <= 4)  return { zone: ZONES.NETTE,   distance }
  return { zone: ZONES.FLOUE, distance }
}

function appliquerEffetVisuel(objet, zone) {
  const couleur = new THREE.Color(objet.couleurOriginale)
  switch(zone) {
    case ZONES.CONTACT:
    case ZONES.NETTE:
      objet.material.color.set(couleur)
      objet.material.transparent = false
      objet.material.opacity = 1
      break
    case ZONES.FLOUE:
      const gris = (couleur.r + couleur.g + couleur.b) / 3
      objet.material.color.setRGB(
        gris + (couleur.r - gris) * 0.3,
        gris + (couleur.g - gris) * 0.3,
        gris + (couleur.b - gris) * 0.3
      )
      objet.material.transparent = true
      objet.material.opacity = 0.6
      break
    case ZONES.HORS_VUE:
      objet.material.color.setRGB(
        couleur.r * 0.15,
        couleur.g * 0.15,
        couleur.b * 0.15
      )
      objet.material.transparent = true
      objet.material.opacity = 0.5
      break
  }
}

function scannerEnvironnement() {
  let objetLePlusProche = null
  let distanceMin = Infinity
  let zoneLaPlusProche = ZONES.HORS_VUE
  for (const objet of objetsCollidables) {
    const { zone, distance } = calculerZoneVision(objet)
    appliquerEffetVisuel(objet, zone)
    if (zone !== ZONES.HORS_VUE && distance < distanceMin) {
      distanceMin = distance
      objetLePlusProche = objet
      zoneLaPlusProche = zone
    }
  }
  return { objet: objetLePlusProche, zone: zoneLaPlusProche, distance: distanceMin }
}

// ============================================
// SYSTEME DE COLLISION
// ============================================

function detecterCollision(positionTest) {
  for (const objet of objetsCollidables) {
    const dx = positionTest.x - objet.position.x
    const dz = positionTest.z - objet.position.z
    const distance = Math.sqrt(dx * dx + dz * dz)
    if (distance < RAYON_CAINE + objet.rayonCollision) return objet
  }
  return null
}

function calculerContournement(objetObstacle) {
  const angle = Math.atan2(
    caine.position.z - objetObstacle.position.z,
    caine.position.x - objetObstacle.position.x
  )
  const sens = Math.random() > 0.5 ? 1 : -1
  const angleCotourne = angle + (Math.PI / 2) * sens
  const rayon = RAYON_CAINE + objetObstacle.rayonCollision + 0.5
  return new THREE.Vector3(
    objetObstacle.position.x + Math.cos(angleCotourne) * rayon,
    1,
    objetObstacle.position.z + Math.sin(angleCotourne) * rayon
  )
}

// ============================================
// CREATION PAR CAINE
// ============================================

function supprimerVieuxObjet() {
  if (memoire.creations.length === 0) return
  let plusVieille = memoire.creations[0]
  let idx = 0
  for (let i = 1; i < memoire.creations.length; i++) {
    if (memoire.creations[i].age > plusVieille.age) {
      plusVieille = memoire.creations[i]
      idx = i
    }
  }
  scene.remove(plusVieille.objet)
  plusVieille.objet.geometry.dispose()
  plusVieille.objet.material.dispose()
  const ic = objetsCollidables.indexOf(plusVieille.objet)
  if (ic > -1) objetsCollidables.splice(ic, 1)
  for (const pile of piles) {
    const ip = pile.objets.indexOf(plusVieille.objet)
    if (ip > -1) { pile.objets.splice(ip, 1); break }
  }
  for (let i = piles.length - 1; i >= 0; i--) {
    if (piles[i].objets.length === 0) piles.splice(i, 1)
  }
  memoire.creations.splice(idx, 1)
  console.log('Caine efface sa plus vieille creation !')
}

function caineCreer() {
  if (memoire.creations.length >= MAX_OBJETS) {
    supprimerVieuxObjet()
  }

  const forme   = choisirAuHasard(Object.values(FORMES))
  const couleur = choisirAuHasard(PALETTE)
  const angleRegard = caine.rotation.y
  const dist = 1.8
  const x = caine.position.x + Math.sin(angleRegard) * dist
  const z = caine.position.z + Math.cos(angleRegard) * dist

  const dejaCree = memoire.creations.some(c => {
    const dx = c.position.x - x
    const dz = c.position.z - z
    return Math.sqrt(dx * dx + dz * dz) < 0.8
  })

  if (dejaCree) {
    console.log('Caine a deja cree ici, il cherche ailleurs...')
    cerveau.etat = ETATS.CHOISIR
    return false
  }

  const objet = poserObjet(forme, x, z, couleur)
  if (objet) {
    memoire.creations.push({
      forme, couleur,
      position: { x: objet.position.x, y: objet.position.y, z: objet.position.z },
      objet, age: 0
    })
    console.log('Caine a cree un ' + forme + ' ! (' + memoire.creations.length + '/' + MAX_OBJETS + ')')
    return true
  }
  return false
}

// ============================================
// CERVEAU DE CAINE
// ============================================

const ETATS = {
  CHOISIR:    'choisir',
  MARCHER:    'marcher',
  CONTOURNER: 'contourner',
  ENQUETER:   'enqueter',
  EXAMINER:   'examiner',
  CREER:      'creer',
  OBSERVER:   'observer'
}

const cerveau = {
  etat:              ETATS.CHOISIR,
  destination:       new THREE.Vector3(),
  destinationFinale: new THREE.Vector3(),
  vitesse:           0.05,
  tempsAttente:      0,
  dureeAttente:      0,
  cible:             null,
  perception:        { objet: null, zone: ZONES.HORS_VUE, distance: Infinity }
}

function choisirDestination() {
  if (piles.length > 0 && Math.random() < 0.5) {
    const pilesFiltrees = piles.filter(p => p.objets.length < HAUTEUR_MAX_PILE)
    if (pilesFiltrees.length > 0) {
      const pileChoisie = pilesFiltrees.reduce((max, p) => p.objets.length > max.objets.length ? p : max)
      cerveau.destination.set(pileChoisie.x, 1, pileChoisie.z)
      cerveau.destinationFinale.set(pileChoisie.x, 1, pileChoisie.z)
      cerveau.etat = ETATS.MARCHER
      console.log('Caine veut continuer sa pile de ' + pileChoisie.objets.length + ' etages !')
      return
    }
  }
  const x = (Math.random() - 0.5) * 30
  const z = (Math.random() - 0.5) * 30
  cerveau.destination.set(x, 1, z)
  cerveau.destinationFinale.set(x, 1, z)
  cerveau.cible = null
  cerveau.etat = ETATS.MARCHER
}

function deplacerVerDestination(destination) {
  const direction = new THREE.Vector3()
  direction.subVectors(destination, caine.position)
  const distance = direction.length()
  if (distance > 0.2) {
    direction.normalize()
    const prochainePosition = new THREE.Vector3(
      caine.position.x + direction.x * cerveau.vitesse,
      1,
      caine.position.z + direction.z * cerveau.vitesse
    )
    const obstacle = detecterCollision(prochainePosition)
    if (obstacle) {
      if (Math.random() > 0.5) {
        cerveau.destination = calculerContournement(obstacle)
        cerveau.etat = ETATS.CONTOURNER
      } else {
        cerveau.etat = ETATS.CHOISIR
      }
    } else {
      caine.position.x = prochainePosition.x
      caine.position.z = prochainePosition.z
      caine.rotation.y = Math.atan2(direction.x, direction.z)
    }
    return false
  }
  return true
}

function mettreAJourCerveau() {
  cerveau.perception = scannerEnvironnement()
  coneVision.position.copy(caine.position)
  coneVision.position.y = 0.05
  coneVision.rotation.y = caine.rotation.y

  if (cerveau.etat === ETATS.CHOISIR) {
    choisirDestination()
  }

  else if (cerveau.etat === ETATS.MARCHER) {
    if (cerveau.perception.objet && cerveau.perception.zone === ZONES.FLOUE && Math.random() < 0.003) {
      console.log('Caine voit quelque chose au loin...')
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
      console.log('Caine examine de pres !')
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
    if (cerveau.tempsAttente >= cerveau.dureeAttente) {
      cerveau.etat = ETATS.CREER
    }
  }

  else if (cerveau.etat === ETATS.CREER) {
    caineCreer()
    cerveau.etat = ETATS.OBSERVER
    cerveau.tempsAttente = 0
    cerveau.dureeAttente = Math.random() * 300 + 200
  }

  else if (cerveau.etat === ETATS.OBSERVER) {
    cerveau.tempsAttente++
    for (const creation of memoire.creations) creation.age++
    if (cerveau.tempsAttente >= cerveau.dureeAttente) cerveau.etat = ETATS.CHOISIR
  }
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
  pointer-events: none; line-height: 1.8;
`
document.body.appendChild(ui)

function mettreAJourUI() {
  const p = cerveau.perception
  const objetVu = p.objet ? p.objet.forme : 'rien'
  const distanceVue = p.distance === Infinity ? '—' : p.distance.toFixed(1) + 'm'
  const hauteurMaxPile = piles.length > 0 ? Math.max(...piles.map(p => p.objets.length)) : 0

  ui.innerHTML =
    '<b style="color:#9b59b6">CAINE</b><br>' +
    'Etat : ' + cerveau.etat + '<br>' +
    'Voit : ' + objetVu + ' (' + p.zone + ')<br>' +
    'Distance : ' + distanceVue + '<br>' +
    'Creations : ' + memoire.creations.length + '/' + MAX_OBJETS + '<br>' +
    'Piles : ' + piles.length + ' (max ' + hauteurMaxPile + ' etages)'
}

// ============================================
// BOUCLE D'ANIMATION
// ============================================

function animate() {
  requestAnimationFrame(animate)
  mettreAJourCerveau()
  mettreAJourUI()
  renderer.render(scene, camera)
}

animate()