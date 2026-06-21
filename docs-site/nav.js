// hermes-editing-yt docs-site navigation behaviour
(function () {
  const links = document.querySelectorAll('.sidebar a');
  const path = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(function (a) {
    if (a.getAttribute('href') === path) {
      a.classList.add('active');
    }
  });
})();
