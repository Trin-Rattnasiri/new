-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 10, 2025 at 09:18 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hospital_booking`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `slot_id` int(11) DEFAULT NULL,
  `booking_date` date NOT NULL DEFAULT curdate(),
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `booking_reference_number` varchar(20) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `hn` varchar(50) DEFAULT NULL,
  `created_by` varchar(20) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `department_id`, `slot_id`, `booking_date`, `status`, `booking_reference_number`, `name`, `hn`, `created_by`, `phone_number`) VALUES
(101, 21, 33, '2025-04-20', 'pending', '20250419-00101', 'จรัสศรี หนีห่าว', 'HN00000002', '1209802814890', NULL),
(102, 21, 33, '2025-04-20', 'pending', '20250419-00102', 'ปุณยวีร์ พร้อมมูล', 'HN00000001', '1909802814890', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`) VALUES
(21, 'kkkk');

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

CREATE TABLE `news` (
  `id` int(11) NOT NULL,
  `imageUrl` varchar(255) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `news`
--

INSERT INTO `news` (`id`, `imageUrl`, `caption`, `createdAt`) VALUES
(12, '/news/78359637-2910-4c25-acaf-beada02ffd3a-phiphi-island-edit.jpg', 'เกาะพีพี', '2025-04-10 17:08:45'),
(13, '/news/72b89ed9-68ea-4341-93a3-83c361c3e2b5-Ko_Lanta_Beach.jpg', 'เกาะรันตา', '2025-04-10 17:16:10'),
(14, '/news/80486947-9201-4d13-8f81-b791203dfcec-fight.jpg', 'ช่วยสู้', '2025-04-10 17:16:28'),
(15, '/news/5f353b16-aa82-4664-9346-882d876020b8-1.jpg', 'นั้ง', '2025-04-10 17:20:59');

-- --------------------------------------------------------

--
-- Table structure for table `slots`
--

CREATE TABLE `slots` (
  `id` int(11) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `slot_date` date DEFAULT NULL,
  `available_seats` int(11) DEFAULT 10,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `slots`
--

INSERT INTO `slots` (`id`, `department_id`, `slot_date`, `available_seats`, `start_time`, `end_time`) VALUES
(33, 21, '2025-04-20', 18, '09:37:00', '11:37:00');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(30) NOT NULL,
  `hn` varchar(20) DEFAULT NULL,
  `citizenId` varchar(191) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `name` varchar(100) DEFAULT NULL,
  `birthday` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `hn`, `citizenId`, `phone`, `password`, `createdAt`, `name`, `birthday`) VALUES
(6, 'HN00000001', '1909802814890', '0641815842', '$2b$10$ysPlw2tkgWKGQLuUwdwP4.H/qlespXDp/xHj854PPmfR6i5DFQ45C', '2025-04-11 01:23:35.000', 'ปุณยวีร์ พร้อมมูล', '2003-12-24'),
(7, 'HN00000002', '1209802814890', '0918470549', '$2b$10$dAsk9Q/sC08eq7gpUldzM.iLnxxdxBsod4XjliLB7OM0k8XVyP//O', '2025-04-11 01:25:05.000', 'จรัสศรี หนีห่าว', '2003-11-11');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `slot_id` (`slot_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `slots`
--
ALTER TABLE `slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `citizenId` (`citizenId`),
  ADD UNIQUE KEY `hn` (`hn`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `slots`
--
ALTER TABLE `slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
