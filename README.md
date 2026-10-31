# hackathon

# WASTE TO WORTH — Making Local Waste Collection Traceable and Circular

> **Intermediate Level Circular Economy & Waste Traceability System**  
> Designed for local municipalities, citizens, small businesses, verified waste pickers/cooperatives, and certified recycling plants.

---

## 1. Overview & Context

Effective waste management is held back by limited segregation at source, gaps in organized collection and transport, unregulated dumping in rural and peri-urban areas, and weak links between waste generators, collectors, and recyclers. Plastic pollution and inaccurate reporting add immense pressure to local ecosystems and circular-economy initiatives.

**Waste to Worth** is a local waste-to-resource platform that creates transparent, verifiable links between generators, verified collectors, and recycling facilities. It replaces loose guesswork and double-counting with a **closed-loop mass balance accounting ledger**.

---

## 2. Key Architecture & 3 Interface Portals

The platform provides 3 distinct, tailored operational interfaces (plus a municipal oversight portal):

### 1. Citizen & Business Portal (`generator`)
* **Doorstep Pickup Scheduling**: Choose pickup day (Today, Tomorrow, +3 days) and route time window (7–9 AM, 9–11 AM, 5–7 PM) with real-time ward capacity tracking.
* **Waste Category Helper & Detection**:
  * **Rule-based heuristic search**: Over 100 localized keywords across English, Hindi, Marathi, and Bengali (e.g., *doodh packet*, *chai patti*, *cardboard*, *CFL bulb*, *e-waste*).
  * **Image-assisted prebuilt detection**: Analyzes in-browser canvas color spectra and texture characteristics.
  * **Mandatory Human-in-the-Loop policy (Rule 8)**: Image classification is **never** claimed as 100% correct. Confidence is capped at 60%, and manual category correction is permanently enabled. Corrections are tracked in dashboard accuracy metrics.
* **Open Dumping Reporting**: Geo-located reporting of illegal dumping spots with heap size estimation (Small ~25 kg, Medium ~150 kg, Large ~600 kg) and priority active-fire detection for 48-hour municipal cleanup SLAs.
* **Live 5-Stage Status Tracking**: Requested ➔ Collector Matched ➔ Doorstep Weighed ➔ Weighbridge Intake ➔ Certified Recovery Output.
* **Hand-off Verification Code**: 4-digit security PIN (`4812`) to verify physical custody transfer at doorstep.

### 2. Doorstep Collector Portal (`collector`)
* **Route & Inventory Management**: View assigned route stops, estimated weights, customer phone/SMS channels, and vehicle payload capacity.
* **Job Offer Acceptance**: Algorithmic offer matching with one-click Accept or Decline (with reason codes: *Route full*, *Tractor needed*, etc.).
* **Doorstep Scale Weigh-in & Physical Inspection**:
  * Physical bag inspection for contamination and moisture.
  * Doorstep calibrated scale entry for every stream collected.
  * Segregation Quality Rating (*Well sorted*, *Partly sorted*, *Mixed/contaminated*) used to score citizen performance.
* **Lot Manifest Creation & Dispatch**: Aggregate collected items into certified lots (e.g., `L-201`), select optimal verified recycling facilities, and log vehicle dispatches.

### 3. Recycler & Facility Interface (`processor`)
* **Weighbridge Intake Logging**: Record gross vehicle scale readings upon arrival. Automated alert triggers if inbound weight deviates >5% from collector dispatch weight.
* **Certified Recovery & Mass Balance Ledger**:
  * Record verified secondary raw materials produced (e.g., washed HDPE/PP flakes, grade-1 city compost, baled cardboard fiber).
  * Record rejected impurities and assign legitimate disposal pathways (*Cement kiln co-processing / RDF*, *Engineered sanitary landfill*, *Returned to collector*).
  * Enforces closed mass balance: $\text{Recovered} + \text{Rejected} + \text{Process Loss} = \text{Inbound Received}$.
  * Cryptographic ledger locking: Processed lots cannot be modified or double-counted.

### 4. Municipal Ward Oversight (`admin`)
* Real-time monitoring of open dumping hotspots, burning incidents, and unassigned requests.
* Verification and suspension of scrap dealer licenses, SPCB consent, and ULB ID credentials.
* One-click CSV Audit Ledger export for CPCB/SPCB regulatory compliance.

---

## 3. Multilingual Voice Guidance

Built for low-cost phones and diverse regional populations:
* **Audio Voice Segregation Assistant**: Speaks out clear instructions using native Web Speech Synthesis (`SpeechSynthesisUtterance`) in:
  * **English (`en-IN`)**
  * **हिन्दी / Hindi (`hi-IN`)**
  * **मराठी / Marathi (`mr-IN`)**
  * **বাংলা / Bengali (`bn-IN`)**
* **Subtitles & Transcripts**: Low-bandwidth fallbacks for devices without audio or muted sound.

---

## 4. Algorithmic Matching Formula

Collectors and facilities are matched objectively using a 4-part weighted scoring function:
$$\text{Score} = 40\% \cdot \text{Category Coverage} + 25\% \cdot \text{Proximity} + 20\% \cdot \text{Historical Reliability} + 15\% \cdot \text{Free Capacity}$$

Eligibility gates require:
1. Verified status (audited ULB ID / SPCB authorization).
2. Service coverage in the generator's ward.
3. Acceptance of at least one waste category in the request.
4. Remaining daily route capacity.

---

## 5. Transparent Assumptions & Methodology

* **Zero Double-Counting**:
  * Citizen report estimates are used strictly for vehicle routing and are **never** added into official metrics.
  * Only calibrated digital scale readings taken at the doorstep count as *Collected*.
  * *Recycled* and *Composted* are subsets of *Recovered* — never added as independent sums.
* **Transparent Unit-Weight Planning Table**:
  * Small Bag: Plastic (0.3 kg), Paper (0.8 kg), Organic (1.5 kg), Glass (2.0 kg).
  * 10L Bucket: Plastic (0.8 kg), Paper (2.0 kg), Organic (4.0 kg), Glass (5.0 kg).
  * Full Sack: Plastic (2.5 kg), Paper (6.0 kg), Organic (12.0 kg), Glass (15.0 kg).
* **Climate Impact (GHG Avoidance)**:
  * Calculated exclusively on certified recovered material using conservative lifecycle factors published in **US EPA WARM** and **IPCC 2006 Guidelines (Vol. 5)**.
  * Expressed with explicit uncertainty ranges (e.g., Plastic: 1.2 kg CO₂e/kg, range 0.6–1.8).

---

## 6. Tech Stack & Design System

* **Framework**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS v4, Lucide Icons (clean stroke, zero tacky emoji spam)
* **Design Philosophy**: Editorial minimalism with warm limestone paper (`#f5f6f1`), deep evergreen (`#173f32`), and terracotta accents (`#e36338`).
* **Ergonomics**: 100% responsive across compact mobile phones, tablets, and desktops. Includes Lite Mode (disables heavy image uploads to conserve data).
* **State & Persistence**: Reactive in-memory store with `localStorage` fallback and multi-tab synchronization.

---

## 7. Getting Started

```bash
# Clone the repository
git clone https://github.com/Loafer000/hackathon.git
cd hackathon

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

*Waste to Worth is built for municipal circularity pilots, empowering informal waste pickers and ensuring every gram of recovered resource is verified.*
