## Appointy

Appointy is a flexible, extensible scheduling engine built with clean architecture and proven object‑oriented design patterns. It allows you to define dynamic scheduling rules, generate and manage diverse appointment types, notify stakeholders of changes, organize complex group or recurring bookings, and coordinate interactions across modules—without tangling your codebase.

---

## Table of Contents

- [Features](#features)  
- [Architecture & Design Patterns](#architecture--design-patterns)  
  - [Strategy Pattern](#strategy-pattern)  
  - [Observer Pattern](#observer-pattern)  
  - [Factory Pattern](#factory-pattern)  
  - [Composite Pattern](#composite-pattern)  
  - [Mediator Pattern](#mediator-pattern)  
- [Getting Started](#getting-started)  

---

## Features

- **Dynamic Scheduling Rules**  
  Plug in custom availability, blackout dates, or priority heuristics at runtime.  
- **Real‑Time Notifications**  
  Subscribers receive updates automatically when appointments are booked, modified, or canceled.  
- **Flexible Appointment Types**  
  Easily extend or introduce new appointment types without touching core logic.  
- **Group & Recurring Bookings**  
  Model one‑off, grouped, or multi‑session bookings in a uniform structure.  
- **Module Coordination**  
  Keep modules decoupled—let a central coordinator handle orchestration.

---

## Architecture & Design Patterns

### Strategy Pattern  
**Where:** `scheduling/strategies/`  
**Why:** Business requirements around availability change constantly—holidays, staffing levels, rush hours, special promotions.  
**How:**  
- Define an `ISchedulingRule` interface (e.g., `AllowedHoursRule`, `StaffLoadRule`, `BlackoutDatesRule`).  
- The `Scheduler` accepts any implementation of `ISchedulingRule` at construction or via setter injection.  
- Swap rules at runtime or combine multiple strategies for complex availability logic.  

### Observer Pattern  
**Where:** `notifications/`  
**Why:** Users, admins, and external systems must stay in sync whenever appointments change.  
**How:**  
- The core `Appointment` model acts as the **Subject** with methods `attach(Observer)`, `detach(Observer)`, and `notify()`.  
- Implement concrete **Observers** like `EmailNotifier`, `SMSNotifier`, or `WebhookNotifier`.  
- On state changes (`create`, `update`, `cancel`), observers are automatically triggered.  

### Factory Pattern  
**Where:** `appointments/factories/`  
**Why:** Appointment types evolve—consultation, training, demo, support call—and you don’t want `new` sprinkled across your code.  
**How:**  
- Provide an abstract `AppointmentFactory` with a `create(type, params)` method.  
- Concrete factories (e.g., `ConsultationFactory`, `DemoFactory`) encapsulate creation logic (default durations, pricing rules, required resources).  
- Central `AppointmentFactoryProducer` returns the correct factory based on requested type.  



### Mediator Pattern  
**Where:** `core/mediator/`  
**Why:** Direct module‑to‑module calls (e.g., Scheduler → Notifier → Persistence) lead to tangled dependencies.  
**How:**  
- Introduce an `AppointmentMediator` interface.  
- Concrete `DefaultAppointmentMediator` orchestrates workflows: “when an appointment is booked, check all scheduling rules, persist it, then dispatch notifications.”  
- Modules (e.g., `Scheduler`, `Repository`, `Notifier`) register with the mediator and communicate only via mediator methods (`notifyCreated`, `notifyCancelled`, etc.), keeping them decoupled.  

---

## Getting Started

1. **Clone the repo**  
   ```bash
   git clone https://github.com/your-org/appointy.git
   cd appointy
   ```  
2. **Install dependencies**  
   ```bash
   npm install           # or yarn
   ```  
3. **Configure**  
   Copy `.env.example` to `.env` and set your database, SMTP, and third‑party API credentials.  

4. **Run migrations & seed data**  
   ```bash
   npm run migrate
   npm run seed
   ```  
5. **Start the server**  
   ```bash
   npm start
   ```  

