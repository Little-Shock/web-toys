const overlay = document.querySelector("#overlay");
const card = document.querySelector(".card");
const inputCard1 = document.getElementById('input-card1');
const inputOverlay = document.getElementById('input-overlay');
const imgCard1 = document.getElementById('img-card1');
const imgOverlay = document.getElementById('img-overlay');

// Handle image uploads
function handleImageUpload(event, imgElement) {
	const file = event.target.files[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = function(e) {
			imgElement.src = e.target.result;
			imgElement.style.display = 'block'; // Make sure image is visible
		}
		reader.onerror = function(e) {
			console.error("File could not be read: " + e.target.error.code);
		};
		reader.readAsDataURL(file);
	}
}

inputCard1.addEventListener('change', (event) => handleImageUpload(event, imgCard1));
inputOverlay.addEventListener('change', (event) => handleImageUpload(event, imgOverlay));

// Original mouse interaction logic
card.addEventListener("mousemove", (e) => {
	const { clientX, clientY } = e;
	const rect = card.getBoundingClientRect();

	// Prevent errors if card dimensions are zero (e.g., before image loads)
	if (rect.width === 0 || rect.height === 0) return;

	const mouseX = ((clientX - rect.left) / rect.width) * 100;
	const mouseY = ((clientY - rect.top) / rect.height) * 100;

	const clampedMouseX = Math.min(100, Math.max(0, mouseX));
	const clampedMouseY = Math.min(100, Math.max(0, mouseY));

	const distanceX = Math.abs(50 - mouseX);
	const distanceY = Math.abs(50 - mouseY);
	const distance = Math.min(
		Math.sqrt(distanceX * distanceX + distanceY * distanceY),
		50
	); // Clamp distance

	document.documentElement.style.setProperty("--circle-size", `${distance}%`);

	gsap.to(overlay, { opacity: 1 }); // Removed scale: 1, might conflict if image sizes differ
	gsap.to(
		card,
		{
			"--x": `${clampedMouseX}%`,
			"--y": `${clampedMouseY}%`,
			ease: "sine.out",
			overwrite: 'auto' // Ensure smooth updates
		},
		"<"
	);
});

card.addEventListener("mouseleave", () => {
	document.documentElement.style.setProperty("--circle-size", "0%");
	// Optionally hide overlay smoothly on leave
	// gsap.to(overlay, { opacity: 0, duration: 0.1 });
});

card.addEventListener("click", () => {
	const currentSize = document.documentElement.style.getPropertyValue('--circle-size');
	// Toggle full view on click
	if (currentSize === '100%') {
		document.documentElement.style.setProperty("--circle-size", "0%");
		// gsap.to(overlay, { opacity: 0, duration: 0.2 });
	} else {
		document.documentElement.style.setProperty("--circle-size", "100%");
		gsap.to(overlay, { opacity: 1 }); // Make sure it's visible when fully clipped
	}
});
