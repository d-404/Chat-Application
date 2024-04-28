# Chat-Application

- A scalable and secure chat application backend built with Node.js, PostgreSQL, Redis, and Kafka for real-time messaging.


## Table of Contents

- [Chat Application](#project-name)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Configuration](#configuration)


## Introduction

- The project aims to develop a chat application backend using Node.js, PostgreSQL for database management, Redis for session management and message caching, and Kafka for handling real-time message delivery. It provides RESTful API endpoints for user authentication, message sending, user management, and more. The backend is designed to be scalable, secure, and efficient, allowing users to communicate seamlessly in real-time while ensuring data integrity and privacy.


## Features

- Real time one-to-one chat
- Message Caching using Redis
- Message queue using Kafka for faster message delivery


## Installation

```bash
# Clone the repository
git clone https://github.com/d-404/Chat-Application.git

# Navigate to the project directory
cd chat-app

# Install dependencies
npm install
```

## Usage

```bash
# Run the project
npm start
```

## Configuration

```bash
# Set environment variables
export PORT=3000
```