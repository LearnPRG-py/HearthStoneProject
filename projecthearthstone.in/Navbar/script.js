const headerUrl = new URL('./index.html', import.meta.url);

fetch(headerUrl)
  .then(res => res.text())
  .then(html => {
    document.getElementById("navbarcontainer").innerHTML = html;

    const navbar = document.getElementById('navbar');
    const sentinel = document.getElementById('sentinel');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');
    const navInner = document.getElementById('navInner');
    let isHamburgerOpen = false;

    if (navbar && sentinel) {
      new IntersectionObserver(([entry]) => {
          navbar.classList.toggle("dock", !entry.isIntersecting);
          updateNavbarWidth();
      }).observe(sentinel);
    }

    if (hamburgerBtn && navMenu) {
      hamburgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('hidden');
        if (!isHamburgerOpen) {
          navInner.style.overflow = "visible";
          isHamburgerOpen = true;
        }
        else {
          navInner.style.overflow = "hidden";
          isHamburgerOpen = false;
        }
      });
    }
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = document.title.replace("Oakridge Codefest 2026 - ", "");
    }
  });
function updateNavbarWidth() {
    const navbar = document.querySelector(".navbar");
    const navInner = document.querySelector(".nav-inner");
    const navMenu = document.querySelector(".nav-menu");

    if (!navbar.classList.contains("dock")) {
        navInner.style.width = "";
        return;
    }

    const rect = navMenu.getBoundingClientRect();

    const styles = getComputedStyle(navInner);
    const padding =
        parseFloat(styles.paddingLeft) +
        parseFloat(styles.paddingRight);

    const width = Math.min(
        rect.width + padding + 20,
        window.innerWidth * 0.9
    );

    navInner.style.width = `${width}px`;
}

window.addEventListener("resize", updateNavbarWidth);
window.addEventListener("load", updateNavbarWidth);