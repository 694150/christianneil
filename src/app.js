(() => {
  const pages = [...document.querySelectorAll('.page')];
  const links = [...document.querySelectorAll('[data-page]')];
  const main = document.getElementById('main-content');
  const intro = document.getElementById('intro');
  const desktop = document.getElementById('desktop');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let introTimer;
  let exitTimer;

  // Static HTML is a complete, navigable page. Enhance only after setup succeeds.
  try {

    const projectModal = document.getElementById('project-modal');
    const projectModalContent = document.getElementById('project-modal-content');
    let projectModalTrigger = null;
    let previousBodyOverflow = '';

    document.querySelectorAll('[data-project-modal]').forEach(trigger => {
      trigger.addEventListener('click', event => {
        // Keep normal link behavior for new-tab gestures and older browsers.
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        const template = document.getElementById(trigger.dataset.projectModal);
        if (!template || !projectModal || typeof projectModal.showModal !== 'function') return;
        event.preventDefault();
        projectModalTrigger = trigger;
        projectModalContent.replaceChildren(template.content.cloneNode(true));
        projectModal.setAttribute('aria-labelledby', projectModalContent.querySelector('h2').id);
        previousBodyOverflow = document.body.style.overflow;
        projectModal.showModal();
        document.body.style.overflow = 'hidden';
        projectModal.scrollTop = 0;
      });
    });

    document.getElementById('project-modal-close').addEventListener('click', () => projectModal.close());
    projectModal.addEventListener('click', event => {
      if (event.target !== projectModal) return;
      const rect = projectModal.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) projectModal.close();
    });
    // Native dialog handles Escape, focus trapping, and making the background inert.
    projectModal.addEventListener('close', () => {
      document.body.style.overflow = previousBodyOverflow;
      if (projectModalTrigger?.isConnected) projectModalTrigger.focus({ preventScroll: true });
      projectModalTrigger = null;
    });

    const projectFilters = [...document.querySelectorAll('[data-project-filter]')];
    const projectCards = [...document.querySelectorAll('#project-grid .project-card')];
    const projectResults = document.getElementById('project-results');
    const projectEmpty = document.getElementById('project-empty');

    projectFilters.forEach(button => {
      button.addEventListener('click', () => {
        const category = button.dataset.projectFilter;
        let count = 0;
        projectCards.forEach(card => {
          const services = (card.dataset.services || '').split(' ');
          const matches = category === 'all' || services.includes(category);
          card.hidden = !matches;
          if (matches && card.classList.contains('project-published')) count++;
        });
        projectFilters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
        projectEmpty.hidden = count > 0;
        projectResults.textContent = category === 'all'
          ? `${count} ${count === 1 ? 'project' : 'projects'} · More work coming soon`
          : `${count} ${count === 1 ? 'project' : 'projects'} in ${button.textContent.trim()}`;
      });
    });

    const quoteElement = document.getElementById('sidebar-quote');
    const encouragements = [
      'Take one useful step today. Small steps still move you forward.',
      'Make a little room for what matters to you.',
      'You can ask for help and still be capable.',
      'Rest can be part of progress.',
      'Listen to understand. A little patience can change a conversation.',
      'You do not need every answer to take the next step.',
      'Be kind in the small moments. They count, too.',
      'Give yourself the patience you would offer a friend.',
      'Focus on the next thing you can do, not everything at once.',
      'Leave room in your day for something that makes you smile.',
      'Let curiosity turn a mistake into something you can learn.',
      'Notice the effort you have made, even when the result takes time.'
    ];
    let currentQuote = -1;

    function refreshQuote() {
      if (!quoteElement) return;
      const choices = encouragements.map((_, index) => index).filter(index => index !== currentQuote);
      currentQuote = choices[Math.floor(Math.random() * choices.length)];
      quoteElement.textContent = '“' + encouragements[currentQuote] + '”';
    }

    refreshQuote();
    setInterval(() => {
      if (!document.hidden && intro.hidden) refreshQuote();
    }, 60000);

    function showPage(moveFocus = false, startAtTop = false) {
      if (projectModal?.open) projectModal.close();
      const requested = location.hash.slice(1);
      const target = document.getElementById(requested);
      const targetPage = target?.closest('.page');
      const selected = targetPage ? targetPage.id : 'home';
      pages.forEach(page => { page.hidden = page.id !== selected; });
      links.forEach(link => {
        const active = link.dataset.page === selected;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      if (moveFocus && intro.hidden) {
        const page = document.getElementById(selected);
        const destination = targetPage && target !== targetPage
          ? target : document.getElementById(page.getAttribute('aria-labelledby')) || main;
        destination.setAttribute('tabindex', '-1');
        destination.focus({ preventScroll: true });
        if (startAtTop || !targetPage || target === targetPage) scrollTo({ top: 0, left: 0, behavior: 'instant' });
        else destination.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    }

    function closeIntro() {
      if (intro.hidden || intro.classList.contains('leaving')) return;
      clearTimeout(introTimer);
      intro.classList.add('leaving');
      exitTimer = setTimeout(() => {
        intro.hidden = true;
        desktop.inert = false;
        document.body.style.overflow = '';
        // Keep reading focus in the content without skipping the header and sidebar.
        showPage(true, true);
      }, reducedMotion ? 0 : 450);
    }

    function openIntro() {
      clearTimeout(introTimer);
      clearTimeout(exitTimer);
      intro.hidden = false;
      intro.classList.remove('leaving');
      desktop.inert = true;
      document.body.style.overflow = 'hidden';
      const progress = intro.querySelector('.loading-track span');
      progress.style.animation = 'none';
      void progress.offsetWidth;
      progress.style.animation = '';
      document.getElementById('skip-intro').focus({ preventScroll: true });
      introTimer = setTimeout(closeIntro, 1750);
    }

    document.getElementById('skip-intro').addEventListener('click', closeIntro);
    document.getElementById('replay-intro').addEventListener('click', openIntro);
    intro.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeIntro();
      if (event.key === 'Tab') { event.preventDefault(); document.getElementById('skip-intro').focus(); }
    });
    addEventListener('hashchange', () => {
      if (document.documentElement.classList.contains('workspace-ready')) showPage(true);
    });
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        if (!document.documentElement.classList.contains('workspace-ready')) return;
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const href = link.getAttribute('href');
        // A repeated page link does not fire hashchange. Reset it explicitly.
        if (href === location.hash && pages.some(page => '#' + page.id === href)) {
          event.preventDefault();
          showPage(true, true);
        }
      });
    });
    showPage();
    openIntro();
    document.documentElement.classList.add('workspace-ready');
    document.querySelectorAll('[data-js-only]').forEach(control => { control.hidden = false; });
  } catch (error) {
    // An initialization error must never strand visitors behind the intro or hide content.
    clearTimeout(introTimer);
    clearTimeout(exitTimer);
    intro.hidden = true;
    desktop.inert = false;
    document.body.style.overflow = '';
    pages.forEach(page => { page.hidden = false; });
    links.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    });
    document.documentElement.classList.remove('workspace-ready');
    document.querySelectorAll('[data-js-only]').forEach(control => { control.hidden = true; });
    console.error('Workspace enhancements unavailable; showing all sections.', error);
  }
})();
