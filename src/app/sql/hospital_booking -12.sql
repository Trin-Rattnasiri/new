-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 08, 2025 at 05:14 PM
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
  `created_by` varchar(13) DEFAULT NULL,
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

INSERT INTO `bookings` (`id`, `created_by`, `user_name`, `department_id`, `slot_id`, `booking_date`, `phone_number`, `id_card_number`, `status`, `booking_reference_number`) VALUES
(72, '1909802814890', 'sssss', 17, 30, '2025-04-08', '1234567891', '1909802714890', 'pending', '20250408-00072'),
(73, '1909802814890', 'มิก', 17, 30, '2025-04-08', '0641815842', '1234567891234', 'pending', '20250408-00073'),
(74, NULL, 'ววว', 17, 30, '2025-04-08', '1234567891', '1309802814890', 'pending', '20250408-00074');

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
(17, 'kkkkk');

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
(26, 13, '2025-04-15', 2, '23:46:00', '12:46:00'),
(27, 15, '2025-04-20', 3, '22:00:00', '12:00:00'),
(28, 16, '2025-04-30', 17, '08:00:00', '10:00:00'),
(29, 16, '2025-04-30', 20, '08:00:00', '10:00:00'),
(30, 17, '2025-04-15', 12, '21:00:00', '12:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(30) NOT NULL,
  `prefix` varchar(50) NOT NULL,
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

INSERT INTO `user` (`id`, `prefix`, `citizenId`, `phone`, `password`, `createdAt`, `name`, `birthday`) VALUES
(1, 'นาย', '1909802814890', '0641815842', '$2b$10$tUJsoWFwSORA8WCSE7Wv8eO42K5g7iMO8o3h42dVosmGBKQq7VNLi', '2025-04-06 20:03:52.963', 'ปุณยวีรื พร้อมมูล', '2025-04-22'),
(2, 'นางสาว', '1209802814890', '1234567890', '$2b$10$lRRZvjOXQtmPpMdPkQ0QMeDXChZLgeElrbCkoMSqo/aKt2gkuIAMW', '2025-04-08 02:56:35.320', 'จรักศีล ศีล', '2002-12-08');

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
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `citizenId` (`citizenId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `slots`
--
ALTER TABLE `slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
