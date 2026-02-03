# Accessible QR Audio Generator

This project is a Django-based web application built to improve accessibility for visually impaired users by connecting physical products to clear, immediate audio information. Businesses can generate QR codes that, when scanned, automatically play a text-to-speech audio description of a product—no screens or extra interaction required.

The idea behind this project came from a desire to remove everyday barriers faced by blind users. Rather than treating accessibility as an add-on, the entire application was designed around an audio-first experience. While the project was developed with an academic rubric in mind, the main goal was to create something genuinely useful, thoughtful, and technically strong.

---

## Design Approach

This project was intentionally designed to go beyond basic functionality. Each major feature reflects a balance of creativity, solid coding practices, architectural complexity, and technical skill.

---

## Creativity

### Directional Audio Beacon

One of the biggest challenges for blind users is locating a QR code in the first place. Most scanners give no feedback until the code is already centered. To solve this, the scanner includes a directional audio beacon built with the Web Audio API.

When a QR code enters the camera’s view, a soft beep begins playing. The sound pans left or right in the user’s headphones based on where the QR code is positioned on the screen, helping guide the user toward it. As the QR code gets closer, the beep increases in frequency, similar to a Geiger counter. This turns scanning into a guided, intuitive process instead of trial and error.

### Audio-First Workflow

The experience is designed to be as hands-free as possible. The camera activates automatically, the beacon guides the user, the QR code is read without manual input, and the product description is spoken aloud immediately. Afterward, the app can return to scanning mode for the next product, reducing cognitive load and unnecessary interaction.

---

## Software Coding Practices

- **Separation of Concerns:** All CSS and JavaScript are stored in external static files, improving readability, maintainability, and performance.
- **Object-Oriented JavaScript:** Frontend logic is organized into ES6 classes such as `Dashboard`, `QRScanner`, and `DirectionalBeacon`, keeping responsibilities clearly defined.
- **Purposeful Commenting:** Comments explain the reasoning behind non-trivial logic, especially in Django views, model methods, and complex frontend code.
- **Clear Documentation:** This README reflects intentional design choices and clearly communicates how and why the system works.

---

## Complexity

- **Django MVT Architecture:** The project follows Django’s Model-View-Template pattern, cleanly separating data, logic, and presentation.
- **Meaningful Abstractions:** Complex functionality is broken into reusable components. For example, the `DirectionalBeacon` class encapsulates Web Audio API logic, keeping the QR scanner simple and modular.
- **RESTful Communication:** A lightweight API endpoint supports drag-and-drop interactions on the dashboard, allowing dynamic updates without full page reloads.

---

## Technical Skill

- **Advanced Web Audio API:** Uses `AudioContext`, `StereoPannerNode`, and dynamically controlled oscillators to create real-time directional audio feedback.
- **Modern JavaScript (ES6):** Includes classes, arrow functions, `const`/`let`, and Promises throughout the frontend.
- **Django Best Practices:** Implements class-based views, `LoginRequiredMixin` for authentication, `reverse_lazy` for URL management, and Django’s ORM for database interactions.
- **Accessibility (ARIA):** Uses ARIA roles and live regions (`aria-live="polite"`) to ensure screen reader users receive real-time feedback.

---

## Core Features

- Secure, login-protected business dashboard  
- Product and folder management  
- Drag-and-drop organization interface  
- Reusable templates for product descriptions  
- Automatic QR code generation  
- Directional audio QR scanner designed for blind users  

---

## Summary

This project demonstrates how thoughtful design and strong technical implementation can work together to remove real-world accessibility barriers. By prioritizing an audio-first experience and leveraging modern web technologies, the application provides a practical and inclusive solution for visually impaired users.
