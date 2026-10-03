# Guide de Personnalisation — Site Console Behringer X32

Ce guide vous explique pas-à-pas comment **personnaliser facilement les photos et les textes** de vos procédures d'allumage et d'extinction.

---

## 📸 1. Comment ajouter ou changer les photos de chaque étape ?

Toutes les images du site sont rangées dans le dossier **`images/`**.

### Le système de galerie automatique :
Chaque étape contient un conteneur `<div class="step-gallery" data-gallery>` :
* Si vous mettez **1 seule image**, le site affiche une belle photo grand format avec effet de zoom au clic.
* Si vous mettez **2, 3 images ou plus**, le site crée automatiquement :
  - Un carrousel avec boutons fléchés **Précédent (‹)** et **Suivant (›)**.
  - Un compteur de photos (ex: *1 / 2 photos*).
  - Une rangée de **miniatures cliquables** en dessous.
  - Une **modale plein écran (Lightbox)** dans laquelle on peut naviguer entre toutes les photos de l'étape (au clic, avec les touches fléchées du clavier ou par glissement sur smartphone).

---

### Cas A : Mettre UNE SEULE image pour une étape
Ouvrez le fichier HTML (`allumer.html` ou `eteindre.html`) avec le **Bloc-notes**, **VS Code** ou un éditeur de texte.  
Dans l'étape souhaitée, laissez une seule balise `<img>` :

```html
<div class="step-gallery" data-gallery>
  <img src="images/ma-photo.jpg" alt="Description de votre photo">
</div>
```

---

### Cas B : Mettre PLUSIEURS images pour une étape (ex: 2, 3 ou 4 photos)
Ajoutez simplement autant de lignes `<img>` que vous avez de photos !

```html
<div class="step-gallery" data-gallery>
  <img src="images/photo-1-prise.jpg" alt="1. Brancher la prise murale">
  <img src="images/photo-2-interrupteur.jpg" alt="2. Allumer l'interrupteur à l'arrière">
  <img src="images/photo-3-detail.jpg" alt="3. Vue rapprochée de l'interrupteur">
</div>
```
Le site s'occupe de tout : calcul du nombre d'images, création des vignettes et navigation !

---

### 📝 Comment intégrer vos propres photos (ex: photos du verso de votre feuille) :
1. **Prenez vos photos** de la console ou numérisez/photographiez les images du verso de votre feuille avec votre smartphone.
2. **Copiez vos photos** dans le dossier `images/` de ce site.
3. **Donnez-leur des noms clairs** sans espaces ni accents (ex: `allumage-1-prise.jpg`, `allumage-1-bouton.jpg`, `extinction-1-ecran.jpg`).
4. Dans le fichier HTML (`allumer.html` ou `eteindre.html`), remplacez le chemin dans `src="..."` :
   ```html
   <!-- Exemple de remplacement : -->
   <img src="images/allumage-1-prise.jpg" alt="1. Brancher l’alimentation sur la prise murale">
   ```
5. Enregistrez le fichier (`Ctrl + S`) et rechargez la page dans votre navigateur (`F5`).

---

## ✏️ 2. Comment modifier les textes ou consignes d'une étape ?

Chaque étape est structurée sous cette forme très facile à lire :

```html
<article class="step-card">
  <div class="step-content">
    <div class="step-header">
      <div class="step-number">1</div>
      <span class="step-badge">Mise sous tension</span>
    </div>
    <h2 class="step-title">TITRE DE L'ÉTAPE</h2>
    <div class="step-description">
      <ol>
        <li>Première instruction...</li>
        <li>Deuxième instruction...</li>
      </ol>
    </div>
    ...
  </div>
  ...
</article>
```
- Pour changer le titre : modifiez le texte entre `<h2 class="step-title">` et `</h2>`.
- Pour changer les consignes numérotées : modifiez le texte à l'intérieur des balises `<li>` et `</li>`.

---

## ⚠️ 3. Encarts d'avertissement et conseils

Vous pouvez insérer ou modifier des encarts d'information entre les étapes :

### Encart d'avertissement / sécurité (Jaune)
```html
<div class="info-box warning">
  <div class="info-icon">...</div>
  <div class="info-content">
    <div class="info-title">⚠️ RÈGLE DE SÉCURITÉ</div>
    <div class="info-desc">Votre consigne importante ici...</div>
  </div>
</div>
```

### Encart de conseil ou repère technique (Bleu Cyan)
```html
<div class="info-box tip">
  <div class="info-icon">...</div>
  <div class="info-content">
    <div class="info-title">💡 CONSEIL TECHNIQUE</div>
    <div class="info-desc">Votre explication ou astuce ici...</div>
  </div>
</div>
```

---

## 🖨️ 4. Impression et affichage papier en régie

* Cliquez sur le bouton **"Imprimer"** en haut de la page (ou faites `Ctrl + P`).
* Le style d'impression supprime automatiquement les éléments superflus (barre de navigation, boutons) et met en page un document clair et net, prêt à être plastifié et affiché à côté de la console dans la régie !
