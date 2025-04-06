-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Apr 05, 2025 at 03:58 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

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
  `user_name` varchar(255) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `slot_id` int(11) DEFAULT NULL,
  `booking_date` date NOT NULL DEFAULT curdate(),
  `phone_number` varchar(15) NOT NULL,
  `id_card_number` varchar(13) NOT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `booking_reference_number` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_name`, `department_id`, `slot_id`, `booking_date`, `phone_number`, `id_card_number`, `status`, `booking_reference_number`) VALUES
(6, 'tae', 3, 5, '2025-03-16', '', '', 'pending', NULL),
(7, 'the', 1, 2, '2025-03-20', '', '', 'pending', NULL),
(8, 'hhhhh', 2, 4, '2025-03-20', '', '', 'pending', NULL),
(9, 'trinnnnnn', 1, 2, '2025-03-20', '', '', 'pending', NULL),
(10, 'ยยยยยย', 2, 4, '2025-03-20', '', '', 'pending', NULL),
(11, 'ยยยยยย', 1, 2, '2025-03-20', '001', '3133', 'pending', NULL),
(12, 'ttrytrytyt', 10, 15, '2025-03-23', '0888', '233234', 'pending', NULL),
(13, 'kuy', 1, 8, '2025-03-23', '001', 'trttrt', 'pending', NULL),
(14, 'fffff', 10, 15, '2025-03-23', 'o00', '233', 'pending', NULL),
(15, 'fffff', 1, 8, '2025-03-23', '001', '3133', 'pending', NULL),
(16, 'kunnn', 1, 8, '2025-03-23', '1', '1', 'pending', NULL),
(17, 'trtrrtr', 1, 2, '2025-03-23', '333', '333', 'pending', NULL),
(18, 'sun', 11, 16, '2025-03-23', '0123456789', '1234567890', 'pending', NULL),
(20, 'qqq', 12, 20, '2025-03-25', '1', '1', 'pending', NULL),
(21, 'sun', 12, 20, '2025-03-25', '123', '123', 'pending', '2025-00015'),
(22, 'nes', 12, 20, '2025-03-25', '111', '2122', 'pending', '202500016'),
(23, 'jai', 12, 20, '2025-03-25', '123', '1232', 'cancelled', '202500017'),
(24, 'run', 12, 22, '2025-04-05', '22', '22', 'pending', '202500018'),
(25, 'aaaaaa', 12, 22, '2025-04-05', '1', '1', 'pending', '202500019'),
(26, 'ยยยยยย', 12, 22, '2025-04-05', '1', '2', 'pending', '202500020'),
(27, 'ััั', 12, 22, '2025-04-05', '4', '4', 'pending', '202500021'),
(28, 'wwqee', 12, 22, '2025-04-05', '1', '2', 'pending', '202500022'),
(29, 'พำไำ', 12, 22, '2025-04-05', '2', '3', 'pending', '202500023'),
(30, 'rererrr', 12, 22, '2025-04-05', '55', '55', 'pending', '202500024'),
(31, 'rerererre', 12, 22, '2025-04-05', '2', '2', 'pending', NULL);

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
(1, 'ห้องตรวจแผนกจักษุกรรม'),
(2, 'ห้องตรวจแผนกหู คอ จมูก'),
(6, 'ห้องตรวจโรค'),
(9, 'แผนกอะไร'),
(11, 'แผนกฟัน'),
(12, 'แผนกฟฟฟฟ');

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
(2, 1, '2025-03-20', 7, '00:00:00', '00:00:00'),
(4, 2, '2025-03-20', 8, '00:00:00', '00:00:00'),
(5, 3, '1999-01-01', 4, '00:00:00', '00:00:00'),
(7, 3, '1999-01-01', 5, '00:00:00', '00:00:00'),
(8, 1, '2003-03-03', 0, '00:00:00', '00:00:00'),
(10, 1, '2025-03-30', 13, '00:00:00', '00:00:00'),
(13, 6, '1111-01-01', 1, '00:00:00', '00:00:00'),
(14, 2, '2025-04-04', 4, '00:00:00', '00:00:00'),
(15, 10, '2025-04-05', 5, '00:00:00', '00:00:00'),
(16, 11, '2025-03-24', 4, '00:00:00', '00:00:00'),
(17, 2, '2025-03-09', 6, '00:00:00', '00:00:00'),
(19, 11, '3333-02-19', 3, '11:11:00', '22:22:00'),
(20, 12, '2025-04-03', 1, '22:22:00', '23:23:00'),
(21, 12, '2025-04-03', 5, '11:11:00', '22:22:00'),
(22, 12, '2025-04-11', 2, '11:11:00', '22:22:00');

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
-- Indexes for table `slots`
--
ALTER TABLE `slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `slots`
--
ALTER TABLE `slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
