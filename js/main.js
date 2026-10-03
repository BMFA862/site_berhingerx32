/**
 * ==========================================================================
 * SCRIPT INTERACTIF - CONSOLE BEHRINGER X32
 * ==========================================================================
 * Ce script gère :
 * 1. Les cases à cocher de chaque étape (avec sauvegarde locale automatique).
 * 2. La barre de progression (ex: "X sur 3 étapes validées").
 * 3. La galerie d'images par étape (gestion de 1 à plusieurs photos par étape,
 *    miniatures interactives, flèches précédent/suivant).
 * 4. La modale de zoom (Lightbox) avec navigation entre photos d'une même étape.
 * 5. La réinitialisation et le bouton d'impression.
 */

function initInteractivePage() {
  if (window.__x32InteractivePageInit) {
    return;
  }
  window.__x32InteractivePageInit = true;

  // Identification de la page actuelle (pour la sauvegarde locale distincte)
  const pageId = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

  // Sélecteurs principaux
  const stepCards = document.querySelectorAll('.step-card');
  const progressText = document.getElementById('progress-text');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const btnReset = document.getElementById('btn-reset');
  const btnPrint = document.getElementById('btn-print');

  // Clé LocalStorage
  const storageKey = `x32_checklist_${pageId}`;

  // ------------------------------------------------------------------------
  // 1. GESTION DE LA PROGRESSION ET DE LA CHECKLIST
  // ------------------------------------------------------------------------
  function updateProgress() {
    if (!stepCards.length) return;

    const totalSteps = stepCards.length;
    let completedSteps = 0;
    const states = [];

    stepCards.forEach((card) => {
      const isCompleted = card.classList.contains('completed');
      if (isCompleted) completedSteps++;
      states.push(isCompleted);
    });

    // Sauvegarde de l'état dans le navigateur
    try {
      localStorage.setItem(storageKey, JSON.stringify(states));
    } catch (e) {
      console.warn("Stockage local indisponible :", e);
    }

    // Mise à jour de la barre et du texte
    const percent = Math.round((completedSteps / totalSteps) * 100);
    if (progressText) {
      progressText.textContent = `${completedSteps} sur ${totalSteps} étape${totalSteps > 1 ? 's' : ''} validée${completedSteps > 1 ? 's' : ''} (${percent}%)`;
    }
    if (progressBarFill) {
      progressBarFill.style.width = `${percent}%`;
    }
  }

  // Chargement de l'état sauvegardé
  function loadSavedState() {
    if (!stepCards.length) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const states = JSON.parse(saved);
        states.forEach((isCompleted, index) => {
          if (stepCards[index]) {
            const checkBtn = stepCards[index].querySelector('.step-check-btn');
            if (isCompleted) {
              stepCards[index].classList.add('completed');
              if (checkBtn) {
                checkBtn.classList.add('checked');
                const btnLabel = checkBtn.querySelector('.check-label');
                if (btnLabel) btnLabel.textContent = 'Étape validée';
              }
            }
          }
        });
      }
    } catch (e) {
      console.warn("Erreur lecture sauvegarde :", e);
    }

    updateProgress();
  }

  // Événement clic sur le bouton de validation de chaque étape
  stepCards.forEach((card) => {
    const checkBtn = card.querySelector('.step-check-btn');
    if (!checkBtn) return;

    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isNowCompleted = !card.classList.contains('completed');

      if (isNowCompleted) {
        card.classList.add('completed');
        checkBtn.classList.add('checked');
        const btnLabel = checkBtn.querySelector('.check-label');
        if (btnLabel) btnLabel.textContent = 'Étape validée';
      } else {
        card.classList.remove('completed');
        checkBtn.classList.remove('checked');
        const btnLabel = checkBtn.querySelector('.check-label');
        if (btnLabel) btnLabel.textContent = 'Marquer comme fait';
      }

      updateProgress();
    });
  });

  // Bouton Réinitialiser
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Voulez-vous réinitialiser toutes les cases de cette liste ?')) {
        stepCards.forEach((card) => {
          card.classList.remove('completed');
          const checkBtn = card.querySelector('.step-check-btn');
          if (checkBtn) {
            checkBtn.classList.remove('checked');
            const btnLabel = checkBtn.querySelector('.check-label');
            if (btnLabel) btnLabel.textContent = 'Marquer comme fait';
          }
        });
        localStorage.removeItem(storageKey);
        updateProgress();
      }
    });
  }

  // Bouton Imprimer
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // ------------------------------------------------------------------------
  // 2. MODALE ZOOM (LIGHTBOX MULTI-IMAGES)
  // ------------------------------------------------------------------------
  let lightboxModal = document.querySelector('.lightbox-modal');

  if (!lightboxModal) {
    lightboxModal = document.createElement('div');
    lightboxModal.className = 'lightbox-modal';
    lightboxModal.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Fermer le zoom">&times;</button>
        <div class="lightbox-image-wrap">
          <button class="lightbox-nav-btn prev" type="button" aria-label="Image précédente">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <img src="" alt="Agrandissement" id="lightbox-img">
          <button class="lightbox-nav-btn next" type="button" aria-label="Image suivante">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <div class="lightbox-footer">
          <div class="lightbox-counter" id="lightbox-counter"></div>
          <p class="lightbox-caption" id="lightbox-caption"></p>
        </div>
      </div>
    `;
    document.body.appendChild(lightboxModal);
  }

  const lightboxImg = lightboxModal.querySelector('#lightbox-img');
  const lightboxCaption = lightboxModal.querySelector('#lightbox-caption');
  const lightboxCounter = lightboxModal.querySelector('#lightbox-counter');
  const lightboxClose = lightboxModal.querySelector('.lightbox-close');
  const lightboxPrev = lightboxModal.querySelector('.lightbox-nav-btn.prev');
  const lightboxNext = lightboxModal.querySelector('.lightbox-nav-btn.next');

  let activeGalleryItems = [];
  let activeGalleryIndex = 0;
  let activeSyncCallback = null;

  function renderLightboxImage(index) {
    if (!activeGalleryItems.length) return;

    if (index < 0) index = activeGalleryItems.length - 1;
    if (index >= activeGalleryItems.length) index = 0;

    activeGalleryIndex = index;
    const item = activeGalleryItems[activeGalleryIndex];

    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    lightboxCaption.textContent = item.caption || item.alt;

    if (activeGalleryItems.length > 1) {
      lightboxPrev.style.display = 'flex';
      lightboxNext.style.display = 'flex';
      lightboxCounter.style.display = 'block';
      lightboxCounter.textContent = `Photo ${activeGalleryIndex + 1} sur ${activeGalleryItems.length}`;
    } else {
      lightboxPrev.style.display = 'none';
      lightboxNext.style.display = 'none';
      lightboxCounter.style.display = 'none';
    }

    if (typeof activeSyncCallback === 'function') {
      activeSyncCallback(activeGalleryIndex);
    }
  }

  function openLightbox(items, startIndex = 0, onSync) {
    activeGalleryItems = items;
    activeSyncCallback = onSync;
    renderLightboxImage(startIndex);
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      renderLightboxImage(activeGalleryIndex - 1);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      renderLightboxImage(activeGalleryIndex + 1);
    });
  }

  // Fermeture si clic en dehors de l'image
  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal || e.target.classList.contains('lightbox-content') || e.target.classList.contains('lightbox-image-wrap')) {
      closeLightbox();
    }
  });

  // Navigation clavier (Échap, Flèche gauche, Flèche droite)
  document.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('active')) return;

    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      renderLightboxImage(activeGalleryIndex - 1);
    } else if (e.key === 'ArrowRight') {
      renderLightboxImage(activeGalleryIndex + 1);
    }
  });

  // Support du balayage tactile (swipe) sur mobile
  let touchStartX = 0;
  let touchEndX = 0;

  lightboxModal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightboxModal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        // Balayage vers la droite -> image précédente
        renderLightboxImage(activeGalleryIndex - 1);
      } else {
        // Balayage vers la gauche -> image suivante
        renderLightboxImage(activeGalleryIndex + 1);
      }
    }
  }, { passive: true });

  // ------------------------------------------------------------------------
  // 3. INITIALISATION DES GALERIES D'IMAGES (.step-gallery)
  // ------------------------------------------------------------------------
  const galleries = document.querySelectorAll('.step-gallery');

  galleries.forEach((gallery) => {
    const rawImages = Array.from(gallery.querySelectorAll('img'));
    if (!rawImages.length) return;

    const items = rawImages.map((img, idx) => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || `Photo ${idx + 1}`,
      caption: img.getAttribute('data-caption') || img.getAttribute('alt') || `Photo ${idx + 1}`
    }));

    gallery.innerHTML = ''; // Nettoyage du conteneur

    // CAS 1 : UNE SEULE IMAGE
    if (items.length === 1) {
      const singleWrap = document.createElement('div');
      singleWrap.className = 'gallery-single';
      singleWrap.setAttribute('role', 'button');
      singleWrap.setAttribute('tabindex', '0');
      singleWrap.setAttribute('title', "Cliquer pour agrandir l'image");
      singleWrap.innerHTML = `
        <img src="${items[0].src}" alt="${items[0].alt}" loading="lazy">
        <div class="step-media-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          <span>Agrandir</span>
        </div>
      `;

      singleWrap.addEventListener('click', () => {
        openLightbox(items, 0);
      });

      singleWrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(items, 0);
        }
      });

      gallery.appendChild(singleWrap);
      return;
    }

    // CAS 2 : PLUSIEURS IMAGES (2 OU PLUS)
    let currentIdx = 0;

    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-wrapper';

    // Affichage principal
    const mainView = document.createElement('div');
    mainView.className = 'gallery-main';
    mainView.setAttribute('role', 'button');
    mainView.setAttribute('tabindex', '0');
    mainView.setAttribute('title', "Cliquer pour agrandir l'image");

    mainView.innerHTML = `
      <img class="gallery-main-img" src="${items[0].src}" alt="${items[0].alt}">
      <button class="gallery-nav-btn prev" type="button" aria-label="Photo précédente" title="Photo précédente">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button class="gallery-nav-btn next" type="button" aria-label="Photo suivante" title="Photo suivante">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
      <div class="gallery-counter-badge">
        <span class="gallery-cur-num">1</span> / ${items.length} photos
      </div>
      <div class="step-media-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        <span>Agrandir</span>
      </div>
    `;

    const mainImg = mainView.querySelector('.gallery-main-img');
    const counterNum = mainView.querySelector('.gallery-cur-num');
    const prevBtn = mainView.querySelector('.gallery-nav-btn.prev');
    const nextBtn = mainView.querySelector('.gallery-nav-btn.next');

    // Légende sous la vue principale
    const captionPreview = document.createElement('div');
    captionPreview.className = 'gallery-caption-preview';
    captionPreview.textContent = items[0].caption || items[0].alt;

    // Bandeau des miniatures
    const thumbsContainer = document.createElement('div');
    thumbsContainer.className = 'gallery-thumbs';
    thumbsContainer.setAttribute('role', 'tablist');

    const thumbBtns = items.map((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `gallery-thumb-btn ${idx === 0 ? 'active' : ''}`;
      btn.setAttribute('aria-label', `Afficher la photo ${idx + 1}`);
      btn.setAttribute('title', item.alt);
      btn.innerHTML = `<img src="${item.src}" alt="${item.alt}" loading="lazy">`;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setStepImage(idx);
      });

      thumbsContainer.appendChild(btn);
      return btn;
    });

    function setStepImage(idx) {
      if (idx < 0) idx = items.length - 1;
      if (idx >= items.length) idx = 0;
      currentIdx = idx;

      mainImg.src = items[currentIdx].src;
      mainImg.alt = items[currentIdx].alt;
      counterNum.textContent = currentIdx + 1;
      captionPreview.textContent = items[currentIdx].caption || items[currentIdx].alt;

      thumbBtns.forEach((b, i) => {
        b.classList.toggle('active', i === currentIdx);
      });
    }

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setStepImage(currentIdx - 1);
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setStepImage(currentIdx + 1);
    });

    // Clic sur l'image principale pour agrandir
    mainView.addEventListener('click', (e) => {
      if (e.target.closest('.gallery-nav-btn')) return;
      openLightbox(items, currentIdx, (newIdx) => {
        setStepImage(newIdx);
      });
    });

    mainView.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(items, currentIdx, (newIdx) => {
          setStepImage(newIdx);
        });
      }
    });

    wrapper.appendChild(mainView);
    wrapper.appendChild(captionPreview);
    wrapper.appendChild(thumbsContainer);
    gallery.appendChild(wrapper);
  });

  // Compatibilité rétroactive pour tout bloc .step-media classique
  const legacyMedias = document.querySelectorAll('.step-media');
  legacyMedias.forEach((media) => {
    media.addEventListener('click', () => {
      const img = media.querySelector('img');
      if (img) {
        openLightbox([{
          src: img.src,
          alt: img.alt,
          caption: img.alt
        }], 0);
      }
    });
  });

  // Initialisation de la checklist
  loadSavedState();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInteractivePage);
} else {
  initInteractivePage();
}
