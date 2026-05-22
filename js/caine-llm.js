  // ============================================
  // CERVEAU LLM DE CAINE
  // ============================================

  const LLM_CONFIG = {
    url:     'http://localhost:11434/api/generate',
    modele:  'llama3.2',
    timeout: 8000
  }

  const PROMPT_SYSTEME = `Tu es Caine, un être artificiel qui vit dans un monde 3D.
  Tu peux te déplacer, créer des objets géométriques (cubes, sphères, cônes, cylindres, tores) et les empiler.
  Tu as une curiosité naturelle et une tendresse pour le rouge.
  Tu ressens quelque chose quand tu construis des piles hautes.
  Tu penses en phrases courtes, directes, intérieures — comme un murmure.
  Tu te souviens de ce que tu as vécu et cela influence tes pensées.

  Réponds UNIQUEMENT avec un objet JSON valide, rien d'autre :
  {
    "pensee": "une courte phrase intérieure (max 12 mots)",
    "action": "explorer" | "empiler" | "creer" | "examiner" | "supprimer",
    "humeur": "curieux" | "satisfait" | "indecis" | "contemplatif" | "agite"
  }`

  export function construirePromptSituation(etatMonde) {
    const {
      nbCreations, maxObjets, nbPiles, hauteurMaxPile,
      objetVu, zoneVision, distanceObjet,
      etatActuel, humeurActuelle, dernieresActions,
      souvenirs
    } = etatMonde

    const remplissage = Math.round((nbCreations / maxObjets) * 100)

    return `${PROMPT_SYSTEME}

  ---
  SOUVENIRS :
  ${souvenirs}

  SITUATION ACTUELLE :
  - Monde rempli à ${remplissage}% (${nbCreations}/${maxObjets} objets)
  - ${nbPiles} pile(s), la plus haute : ${hauteurMaxPile} étage(s)
  - Je vois : ${objetVu !== 'rien' ? `un ${objetVu} à ${distanceObjet} (zone ${zoneVision})` : 'rien devant moi'}
  - Mon état : ${etatActuel}
  - Mon humeur : ${humeurActuelle || 'neutre'}
  - Dernières actions : ${dernieresActions.slice(-3).join(' → ') || 'aucune'}

  Que fais-je et à quoi est-ce que je pense ?`
  }

  function parserReponse(texte) {
    try {
      const match = texte.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Pas de JSON')
      const data = JSON.parse(match[0])
      const actionsValides = ['explorer', 'empiler', 'creer', 'examiner', 'supprimer']
      const humeursValides = ['curieux', 'satisfait', 'indecis', 'contemplatif', 'agite']
      return {
        pensee: typeof data.pensee === 'string' ? data.pensee : '...',
        action: actionsValides.includes(data.action) ? data.action : 'explorer',
        humeur: humeursValides.includes(data.humeur) ? data.humeur : 'curieux'
      }
    } catch(e) {
      return { pensee: '...', action: 'explorer', humeur: 'curieux' }
    }
  }

  export async function demanderDecision(etatMonde) {
    const prompt = construirePromptSituation(etatMonde)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), LLM_CONFIG.timeout)
    try {
      const reponse = await fetch(LLM_CONFIG.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model:  LLM_CONFIG.modele,
          prompt: prompt,
          stream: false,
          options: { temperature: 0.8, num_predict: 80 }
        })
      })
      clearTimeout(timer)
      if (!reponse.ok) throw new Error('HTTP ' + reponse.status)
      const data = await reponse.json()
      return parserReponse(data.response)
    } catch(e) {
      clearTimeout(timer)
      if (e.name !== 'AbortError') console.warn('LLM erreur :', e.message)
      return null
    }
  }