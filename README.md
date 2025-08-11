# 🎋 Chinese Fortune Teller - Stochastic Process Oracle 🧧

An elegant, mathematically rigorous fortune teller built with stochastic processes from M 362M (Probability Theory). Experience the ancient art of divination through the lens of modern mathematics, where four distinct stochastic processes reveal your destiny with perfect mathematical fairness.

Each oracle method provides **exactly 50% probability of success and 50% of failure**, meticulously calibrated and proven through rigorous mathematical analysis.

## 🌟 How It Works

The application offers **four sophisticated stochastic processes**, each representing a different mathematical approach to randomness and probability:

### 🎲 Brownian Motion (1D Random Walk)
- **Starting Position**: 5 (perfectly balanced between fortune and misfortune)  
- **Success Boundary**: 10 (brings abundant good fortune)
- **Failure Boundary**: 0 (brings challenging times ahead)
- **Movement**: Symmetric random walk with ±0.5 steps
- **Visualization**: Classic line graph showing the path through probability space

### 🗺️ 2D Random Walk
- **Starting Position**: (5,5) at the center of a 10×10 grid
- **Success**: Reach the right edge (x ≥ 10) OR top edge (y ≥ 10)
- **Failure**: Reach the left edge (x ≤ 0) OR bottom edge (y ≤ 0)
- **Movement**: Equal probability steps in 4 cardinal directions
- **Visualization**: Animated dot tracing a path across the fortune plane

### ⏰ Poisson Process
- **Target**: Accumulate 10 events within exactly 10 seconds
- **Rate**: λ ≈ 0.96687 events per second (mathematically calibrated for perfect balance)
- **Success**: Achieve 10+ events within the time limit
- **Failure**: Fall short of 10 events when time expires
- **Visualization**: Real-time event counter with dynamic time visualization

### 🕸️ Graph Walk
- **Structure**: Symmetric graph with cycles, bridges, and terminal nodes
- **Starting Position**: Central node (perfectly balanced starting point)
- **Success**: Reach the green terminal node (fortune node)
- **Failure**: Reach the red terminal node (misfortune node)
- **Movement**: Random walk along connected graph edges
- **Visualization**: Interactive node graph with highlighted path

## ✨ Features
- **🎯 Four Stochastic Processes**: Multiple sophisticated mathematical approaches to fortune telling
- **⚖️ Mathematically Fair**: Each process rigorously proven to have exactly 50/50 odds
- **🎨 Interactive Visualization**: Real-time simulation displays with dynamic animations
- **📚 Mathematical Proof**: Comprehensive explanation page with detailed fairness proofs
- **🏮 Traditional Aesthetic**: Enhanced Chinese-inspired design with calligraphy and traditional color palettes
- **🈳 Simplified Chinese**: Fortune text displayed in beautiful Chinese characters
- **📱 Responsive Design**: Seamlessly works on desktop, tablet, and mobile devices
- **🎭 Rich Fortunes**: Curated collection of traditional Chinese fortune interpretations

## 🛠️ Technical Implementation

Built with vanilla JavaScript, HTML5 Canvas, and CSS3, this application demonstrates:
- **Probability Theory**: Symmetric random walks and Poisson processes
- **Mathematical Rigor**: Exact 50/50 probability calibration
- **Advanced Visualizations**: Real-time graphical representations
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Performance Optimization**: Smooth animations with efficient rendering

## 🎌 Cultural Elements

The design incorporates authentic Chinese aesthetic elements:
- Traditional red (红) and gold (金) color scheme
- Chinese characters for fortune (运) and destiny (命)
- Calligraphy-inspired typography
- Feng shui principles in layout design
- Classical fortune-telling terminology and imagery
