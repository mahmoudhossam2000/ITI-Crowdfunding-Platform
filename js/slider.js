document.addEventListener("DOMContentLoaded", function () {
  console.log("Slider script loaded");

  const sliderImages = [
    "/assets/images/slider/1341484868_520dda.webp",
    "/assets/images/slider/GettyImages-1341484868-aspect-ratio-796-505.webp",
    "/assets/images/slider/Stocksy_txp14a275bcIDw300_Large_3747320-aspect-ratio-796-505.webp",
    "/assets/images/slider/Stocksy_txp14a275bcIDw300_Large_3899559-aspect-ratio-796-505.webp",
    "/assets/images/slider/Stocksy_txp14a275bcIDw300_Large_4574712-aspect-ratio-796-505.webp",
  ];

  const sliderContainer = document.querySelector(".slider");
  console.log("Slider container found:", sliderContainer);

  if (!sliderContainer) {
    console.error("Slider container not found!");
    return;
  }

  sliderImages.forEach((imagePath, index) => {
    const img = new Image();
    img.onload = function () {
      console.log(`Image ${index} loaded successfully: ${imagePath}`);
    };
    img.onerror = function () {
      console.error(`Image ${index} failed to load: ${imagePath}`);
    };
    img.src = imagePath;
  });

  sliderImages.forEach((imagePath, index) => {
    console.log(`Creating slider item ${index} with image: ${imagePath}`);
    const sliderItem = document.createElement("div");
    sliderItem.classList.add("slider-item");
    sliderItem.style.backgroundImage = `url('${imagePath}')`;

    if (index === 0) {
      sliderItem.classList.add("active");
      console.log(`Set item ${index} as active`);
    }

    sliderContainer.appendChild(sliderItem);
  });

  const sliderItems = document.querySelectorAll(".slider-item");
  let currentSlide = 0;
  const slideInterval = 5000;

  function nextSlide() {
    sliderItems[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % sliderItems.length;

    sliderItems[currentSlide].classList.add("active");
  }

  setInterval(nextSlide, slideInterval);
});
