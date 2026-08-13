// ===== common.js – Shared utilities =====

// ---- WhatsApp Link Generator ----
(function () {
  const BUSINESS_PHONE = "2349155859442";

  function initWhatsAppLinks() {
    document.querySelectorAll("[data-whatsapp]").forEach((el) => {
      const msg = encodeURIComponent(el.getAttribute("data-whatsapp"));
      el.setAttribute("href", `https://wa.me/${BUSINESS_PHONE}?text=${msg}`);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhatsAppLinks);
  } else {
    initWhatsAppLinks();
  }
})();

// ---- Reusable Product Slider ----
(function () {
  "use strict";

  const GAP = 24;
  const AUTO_PLAY_DELAY = 5000;

  function getSlidesPerView() {
    const w = window.innerWidth;
    if (w >= 1280) return 4;
    if (w >= 1024) return 3;
    if (w >= 640) return 2;
    return 1;
  }

  function initSlider(sliderElement) {
    const track = sliderElement.querySelector(".slider-track");
    const slides = sliderElement.querySelectorAll(".slider-slide");
    const prevBtn = sliderElement.querySelector(".slider-prev");
    const nextBtn = sliderElement.querySelector(".slider-next");
    const dotsContainer = sliderElement.querySelector(".slider-dots-container");
    const fadeLeft = sliderElement.querySelector(".slider-fade-left");
    const fadeRight = sliderElement.querySelector(".slider-fade-right");

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    let totalSlides = slides.length;
    let slidesPerView = 1;
    let slideWidth = 0;
    let maxIndex = 0;

    let isDragging = false;
    let startX = 0;
    let dragOffset = 0;
    let isSwiping = false;
    let startY = 0;

    let autoPlayInterval = null;
    let isPaused = false;
    let resizeTimeout = null;

    function updateDimensions() {
      slideWidth = slides[0]?.offsetWidth || 0;
      slidesPerView = getSlidesPerView();
      maxIndex = Math.max(0, totalSlides - slidesPerView);
      if (currentIndex > maxIndex) currentIndex = maxIndex;
      if (currentIndex < 0) currentIndex = 0;
    }

    function getTranslateX(index) {
      return -(index * (slideWidth + GAP));
    }

    function updateSlider(animate = true) {
      const targetX = getTranslateX(currentIndex);
      track.style.transition = animate
        ? "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        : "none";
      track.style.transform = `translateX(${targetX}px)`;

      if (prevBtn) prevBtn.disabled = currentIndex === 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
      updateDots();
      updateFades();
    }

    function updateDots() {
      if (!dotsContainer) return;
      const dotCount = Math.max(1, totalSlides - slidesPerView + 1);
      let dots = dotsContainer.querySelectorAll(".slider-dot");
      if (dots.length !== dotCount) {
        dotsContainer.innerHTML = "";
        for (let i = 0; i < dotCount; i++) {
          const dot = document.createElement("button");
          dot.className = "slider-dot";
          dot.setAttribute("data-index", i);
          dot.addEventListener("click", () => {
            currentIndex = i;
            updateSlider(true);
            resetAutoPlay();
          });
          dotsContainer.appendChild(dot);
        }
        dots = dotsContainer.querySelectorAll(".slider-dot");
      }
      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === currentIndex);
      });
    }

    function updateFades() {
      if (fadeLeft) fadeLeft.classList.toggle("visible", currentIndex > 0);
      if (fadeRight)
        fadeRight.classList.toggle("visible", currentIndex < maxIndex);
    }

    function goToPrev() {
      if (currentIndex > 0) {
        currentIndex--;
        updateSlider(true);
        resetAutoPlay();
      }
    }

    function goToNext() {
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateSlider(true);
        resetAutoPlay();
      }
    }

    function onTouchStart(e) {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      isDragging = true;
      dragOffset = 0;
      isSwiping = false;
      track.style.transition = "none";
      pauseAutoPlay();
    }

    function onTouchMove(e) {
      if (!isDragging) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      if (!isSwiping && Math.abs(deltaX) > 10) {
        if (Math.abs(deltaX) > deltaY * 0.8) {
          isSwiping = true;
        } else {
          return;
        }
      }
      if (!isSwiping) return;

      dragOffset = touch.clientX - startX;
      const currentTranslate = getTranslateX(currentIndex);
      track.style.transform = `translateX(${currentTranslate + dragOffset}px)`;
      e.preventDefault();
    }

    function onTouchEnd() {
      if (!isDragging) return;
      isDragging = false;

      const threshold = slideWidth * 0.3;
      if (isSwiping && Math.abs(dragOffset) > threshold) {
        if (dragOffset < 0 && currentIndex < maxIndex) currentIndex++;
        else if (dragOffset > 0 && currentIndex > 0) currentIndex--;
      }
      isSwiping = false;
      dragOffset = 0;
      updateSlider(true);
      setTimeout(resumeAutoPlay, 300);
    }

    function startAutoPlay() {
      if (autoPlayInterval) clearInterval(autoPlayInterval);
      if (isPaused) return;
      autoPlayInterval = setInterval(() => {
        if (currentIndex >= maxIndex) currentIndex = 0;
        else currentIndex++;
        updateSlider(true);
      }, AUTO_PLAY_DELAY);
    }

    function resetAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
      if (!isPaused) startAutoPlay();
    }

    function pauseAutoPlay() {
      isPaused = true;
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
    }

    function resumeAutoPlay() {
      isPaused = false;
      startAutoPlay();
    }

    function handleResize() {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateDimensions();
        if (currentIndex > maxIndex) currentIndex = maxIndex;
        updateSlider(false);
        resizeTimeout = null;
      }, 150);
    }

    function init() {
      totalSlides = slides.length;
      updateDimensions();
      track.style.transition = "none";
      track.style.transform = `translateX(${getTranslateX(currentIndex)}px)`;
      void track.offsetHeight;
      track.style.transition = "";
      updateSlider(false);

      track.addEventListener("touchstart", onTouchStart, { passive: true });
      track.addEventListener("touchmove", onTouchMove, { passive: false });
      track.addEventListener("touchend", onTouchEnd, { passive: true });
      track.addEventListener("touchcancel", onTouchEnd, { passive: true });

      if (prevBtn) prevBtn.addEventListener("click", goToPrev);
      if (nextBtn) nextBtn.addEventListener("click", goToNext);

      sliderElement.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goToPrev();
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          goToNext();
        }
      });

      window.addEventListener("resize", handleResize);
      sliderElement.addEventListener("mouseenter", pauseAutoPlay);
      sliderElement.addEventListener("mouseleave", resumeAutoPlay);

      startAutoPlay();
      setTimeout(updateFades, 50);
    }

    function destroy() {
      if (autoPlayInterval) clearInterval(autoPlayInterval);
      window.removeEventListener("resize", handleResize);
      sliderElement.removeEventListener("mouseenter", pauseAutoPlay);
      sliderElement.removeEventListener("mouseleave", resumeAutoPlay);
      track.removeEventListener("touchstart", onTouchStart);
      track.removeEventListener("touchmove", onTouchMove);
      track.removeEventListener("touchend", onTouchEnd);
      track.removeEventListener("touchcancel", onTouchEnd);
      if (prevBtn) prevBtn.removeEventListener("click", goToPrev);
      if (nextBtn) nextBtn.removeEventListener("click", goToNext);
    }
    sliderElement._sliderDestroy = destroy;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }

    window.addEventListener("load", () => {
      setTimeout(() => {
        updateDimensions();
        if (currentIndex > maxIndex) currentIndex = maxIndex;
        updateSlider(false);
        updateDots();
      }, 200);
    });
  }

  // Initialise all sliders with class 'product-slider'
  function initAllSliders() {
    document
      .querySelectorAll(".product-slider")
      .forEach((slider) => initSlider(slider));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllSliders);
  } else {
    initAllSliders();
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("promo-video");

  // Check if the video exists on the current page to prevent errors
  if (video) {
    video.addEventListener("click", () => {
      video.muted = !video.muted;
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Find all videos with the 'clickable-video' class
  const videos = document.querySelectorAll(".clickable-video");

  if (videos.length === 0) {
    console.log("No clickable videos found on this page.");
    return;
  }

  // Loop through each video found and attach the click listener
  videos.forEach((video, index) => {
    video.addEventListener("click", () => {
      // Toggle muted state
      video.muted = !video.muted;

      console.log(
        `Video #${index + 1} clicked. Muted status is now: ${video.muted}`,
      );
    });
  });
});
