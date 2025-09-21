-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 16, 2025 at 10:02 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

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
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `position` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_approved` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `position`, `password`, `created_at`, `updated_at`, `is_approved`) VALUES
(10, '6531503056', 'SuperAdmin', '$2b$10$xj3ia7BgtkB6fmdNf0u/DuzrP7P9..oL9FsogHc7SVuzUt0XLriWa', '2025-04-15 09:34:51', '2025-09-15 21:35:37', 1),
(11, '123456789', 'เจ้าหน้าที่', '$2b$10$Y6Il1S.sF8d2Yyh0Ri.vYO6hjtE6cOiidhrmh2HpH/QXC6jq7RDUy', '2025-04-15 09:46:42', '2025-04-15 09:47:18', 1),
(12, '22222222', 'เจ้าหน้าที่', '$2b$10$6Ry2MkEKoJfd.iKmweE92em./KfuXYxAuPp6OpMInBHqeaJYdJCTC', '2025-04-15 10:02:07', '2025-09-04 17:04:17', 0),
(24, '1111111112', 'เจ้าหน้าที่', '$2b$10$y/8f6FUnlEvloVxdkb3VQ.9hSPicNKMdVxbhN6/awEdnbfLvjy3bq', '2025-08-16 16:42:15', '2025-08-17 17:16:27', 0);

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
  `phone_number` varchar(20) DEFAULT NULL,
  `cancelled_by` varchar(10) DEFAULT NULL COMMENT 'ผู้ยกเลิกนัด (user หรือ admin)',
  `is_read_by_admin` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `department_id`, `slot_id`, `booking_date`, `status`, `booking_reference_number`, `name`, `hn`, `created_by`, `phone_number`, `cancelled_by`, `is_read_by_admin`, `read_at`) VALUES
(292, 63, 90, '2025-08-24', 'confirmed', '20250823-00292', 'ปุณยวีร์ พร้อมมูล', 'HN00000008', '1909802814890', NULL, 'admin', 0, NULL),
(319, 62, 95, '2025-09-09', 'confirmed', '20250908-00319', 'ปุณยวีร์ พร้อมมูล', 'HN00000008', '1909802814890', NULL, NULL, 1, '2025-09-05 04:11:05'),
(321, 62, 85, '2025-09-05', 'pending', '20250904-00321', 'ปุณยวีร์ พร้อมมูล', 'HN00000008', '1909802814890', NULL, NULL, 1, '2025-09-05 04:11:05'),
(322, 62, 85, '2025-09-27', 'pending', '20250926-00322', 'ปุณยวีร์ พร้อมมูล', 'HN00000008', '1909802814890', NULL, NULL, 1, '2025-09-15 08:18:01'),
(323, 62, 85, '2025-09-27', 'confirmed', '20250926-00323', 'ปุณยวีร์ พร้อมมูล', 'HN00000008', '1909802814890', NULL, NULL, 1, '2025-09-15 08:18:01'),
(324, 62, 85, '2025-09-27', 'confirmed', '20250926-00324', 'ปุณยวีร์ พร้อมมูล', 'HN00000008', '1909802814890', NULL, NULL, 1, '2025-09-15 08:18:01'),
(330, 62, 85, '2025-09-27', 'pending', '20250926-00330', 'ยามีน ยามาว', 'HN00000016', '1234524680246', NULL, NULL, 1, '2025-09-15 15:32:56');

-- --------------------------------------------------------

--
-- Table structure for table `consent_logs`
--

CREATE TABLE `consent_logs` (
  `id` bigint(20) NOT NULL,
  `citizen_id` varchar(32) NOT NULL,
  `purpose` enum('service','marketing') NOT NULL,
  `consent` tinyint(1) NOT NULL,
  `accepted_at` datetime NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `consent_logs`
--

INSERT INTO `consent_logs` (`id`, `citizen_id`, `purpose`, `consent`, `accepted_at`, `ip`, `user_agent`, `created_at`) VALUES
(3, '1909802814890', 'service', 1, '2025-09-15 22:34:08', '2405:9800:b910:18b0:c8b0:2585:aa90:9ae3', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/15.14.2', '2025-09-15 15:34:09'),
(4, '1909802814890', 'marketing', 1, '2025-09-15 22:34:08', '2405:9800:b910:18b0:c8b0:2585:aa90:9ae3', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/15.14.2', '2025-09-15 15:34:09'),
(7, '1309802814890', 'service', 1, '2025-08-23 23:14:15', '2405:9800:b910:18b0:38c1:6e90:28f5:ceae', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0', '2025-08-23 16:14:15'),
(8, '1309802814890', 'marketing', 1, '2025-08-23 23:14:15', '2405:9800:b910:18b0:38c1:6e90:28f5:ceae', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0', '2025-08-23 16:14:15'),
(17, '6531503056', 'service', 1, '2025-09-15 22:59:44', '2405:9800:b910:18b0:e599:a126:553:5eb4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-15 15:59:45'),
(18, '6531503056', 'marketing', 1, '2025-09-15 22:59:44', '2405:9800:b910:18b0:e599:a126:553:5eb4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-15 15:59:46'),
(21, '0641815842', 'service', 1, '2025-08-25 16:31:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0', '2025-08-25 09:31:32'),
(22, '0641815842', 'marketing', 1, '2025-08-25 16:31:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0', '2025-08-25 09:31:32'),
(69, '1234567890123', 'service', 1, '2025-08-27 11:44:12', '159.192.20.96', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/139.0.7258.76 Mobile/15E148 Safari/604.1', '2025-08-27 04:44:12'),
(70, '1234567890123', 'marketing', 1, '2025-08-27 11:44:12', '159.192.20.96', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/139.0.7258.76 Mobile/15E148 Safari/604.1', '2025-08-27 04:44:12'),
(99, '0987654321', 'service', 1, '2025-08-27 11:39:04', '159.192.20.96', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/139.0.7258.76 Mobile/15E148 Safari/604.1', '2025-08-27 04:39:04'),
(100, '0987654321', 'marketing', 1, '2025-08-27 11:39:04', '159.192.20.96', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/139.0.7258.76 Mobile/15E148 Safari/604.1', '2025-08-27 04:39:04'),
(239, '653150', 'service', 1, '2025-09-01 18:14:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-01 11:14:07'),
(240, '653150', 'marketing', 1, '2025-09-01 18:14:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-01 11:14:07'),
(263, '22222222', 'service', 1, '2025-09-05 00:05:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0', '2025-09-04 17:05:24'),
(264, '22222222', 'marketing', 1, '2025-09-05 00:05:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0', '2025-09-04 17:05:24'),
(327, '1129901789025', 'service', 1, '2025-09-04 16:17:05', '202.28.45.140', 'Mozilla/5.0 (Linux; Android 13; V2124 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.158 Mobile Safari/537.36 Line/15.14.1/IAB', '2025-09-04 09:17:06'),
(328, '1129901789025', 'marketing', 1, '2025-09-04 16:17:05', '202.28.45.140', 'Mozilla/5.0 (Linux; Android 13; V2124 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.158 Mobile Safari/537.36 Line/15.14.1/IAB', '2025-09-04 09:17:06'),
(345, '1908980281489', 'service', 1, '2025-09-04 23:16:09', '2405:9800:b910:18b0:10a9:55e8:f03:8634', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/15.13.0', '2025-09-04 16:16:08'),
(346, '1908980281489', 'marketing', 1, '2025-09-04 23:16:09', '2405:9800:b910:18b0:10a9:55e8:f03:8634', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/15.13.0', '2025-09-04 16:16:08'),
(459, '1214755555555', 'service', 1, '2025-09-15 21:53:46', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-15 14:53:46'),
(460, '1214755555555', 'marketing', 1, '2025-09-15 21:53:46', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-15 14:53:46'),
(465, '1234524680246', 'service', 1, '2025-09-15 22:32:29', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-15 15:32:29'),
(466, '1234524680246', 'marketing', 1, '2025-09-15 22:32:29', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-15 15:32:29');

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
(61, 'แผนกจักษุ'),
(62, 'ตรวจโรค'),
(63, 'แผนกอายุรกรรมโรคหัวใจ'),
(64, 'แผนกรังสี ');

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
(26, '/news/92cb92fc-97e9-411c-ac61-e6ad597e02bd-card1.jpg', '', '2025-04-15 16:36:21'),
(27, '/news/ed719912-379e-413c-8c63-9174fdff5175-fight.jpg', '', '2025-04-15 16:36:26');

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
  `end_time` time NOT NULL,
  `total_seats` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `slots`
--

INSERT INTO `slots` (`id`, `department_id`, `slot_date`, `available_seats`, `start_time`, `end_time`, `total_seats`) VALUES
(63, 47, '2025-04-17', 5, '08:00:00', '09:00:00', 5),
(64, 48, '2025-04-22', 4, '10:00:00', '11:00:00', 4),
(66, 51, '2025-04-27', 9, '10:00:00', '11:00:00', 9),
(68, 56, '2025-04-24', 5, '09:00:00', '15:00:00', 5),
(72, 58, '2025-04-25', 1, '15:00:00', '16:00:00', 1),
(73, 58, '2025-06-10', 6, '15:00:00', '16:00:00', 6),
(84, 60, '2025-08-12', 20, '08:00:00', '11:00:00', 20),
(85, 62, '2025-09-27', 14, '08:00:00', '09:00:00', 19),
(88, 60, '2025-08-11', 5, '12:00:00', '14:00:00', 5),
(92, 72, '2025-09-11', 6, '08:00:00', '15:00:00', 6),
(95, 62, '2025-09-09', 20, '08:00:00', '09:00:00', 21),
(97, 63, '2025-09-26', 50, '08:00:00', '11:00:00', 0);

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
  `birthday` date DEFAULT NULL,
  `prefix` varchar(10) DEFAULT NULL,
  `line_id` varchar(64) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  `line_display_name` varchar(255) DEFAULT NULL COMMENT 'LINE Display Name',
  `line_picture_url` text DEFAULT NULL COMMENT 'LINE Profile Picture URL',
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Last Updated Time'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `hn`, `citizenId`, `phone`, `password`, `createdAt`, `name`, `birthday`, `prefix`, `line_id`, `role`, `line_display_name`, `line_picture_url`, `updatedAt`) VALUES
(38, 'HN00000008', '1909802814890', '0839277425', '$2b$10$X141b6Sfy3oY9pDWFujX4OWPG5jxeE3zzDr2okeSAQ87z7l2yfJaC', '2025-08-10 20:45:39.000', 'ปุณยวีร์ พร้อมมูล', '2003-12-24', 'นาย', 'U31b611e622371de6233e330f9c4ceef6', 'user', 'Sprite', 'https://profile.line-scdn.net/0hzUHfwAl-JXplHzTwJbFbRBVPJhBGbnxoT39sTANPL0hfKGsoQS1iSwcXKUJeLGMsSi1vFFMYeUNHJmZUEHozGldaEksrUGBNTXEVWC0fOFYqQSF3Kh49RSV0eDcPdx9vDXk4HiNHcjYEdzZXS349HSsDJwE2cD9lHUhJLGAtS_kKHVIvSHhsHlEWe0LQ', '2025-09-15 05:24:41'),
(39, 'HN00000009', '1214755555555', '2154684444', '$2b$10$JP4h9gwwjHNUQ/zmQuHXz.P9XwkYn6HMGes6RTcrNgM176QMTEj4.', '2025-08-10 21:14:04.000', 'sun nuttnaon', '2004-01-12', 'นาย', 'Ud7bb9b9a8015a54327af69ca08dfd995', 'user', 'S', 'https://profile.line-scdn.net/0hazTjyhZcPlV5Ey83LyVAKglDPT9aYmdHU3JzYUUXMGwQc34HBn0hO0sUNzBCdioFVXFxZ05HNzJ1AEkzZ0XCYX4jY2RFJXsCXHV5uw', '2025-08-11 14:18:59'),
(46, 'HN00000010', '2839901064910', '0962713586', '$2b$10$7RcDyhgp44q6/fTGhMktZ.OG7EBbnFvsOQBMn0GTI76aS7ZP/YdFm', '2025-08-11 21:30:01.000', 'จรัสศรี จินดานิล', '2004-03-11', 'นางสาว', 'U0f18bdbe2b0cea12bd3f9aa5573ec276', 'user', 'Fah', 'https://profile.line-scdn.net/0hNiSHoHMEEUZ-MQBW2MFvOQ5hEixdQEhUVFJeIk83HHdKAwVAUV4OI04zSCFAUVQVVVELKR5jTyRyImYgYGftcnkBTHdCB1QRW1dWqA', '2025-08-11 14:31:19'),
(47, 'HN00000011', '3909900557154', '0819590704', '$2b$10$lQ2gf8o8U5yapimkdL/Lk.79hxFepJub4XdyxUQEjYw88g85MRIbG', '2025-08-13 19:25:47.000', 'สุมาลี  พร้อมมูล', '1966-07-30', 'นาง', 'U4cb225e6c2321d27a639213b5a690310', 'user', 'à¸ªà¸¸à¸¡à¸²à¸¥à¸µ', 'https://profile.line-scdn.net/0hgwbUcIvMOFhPLC3gy1NGJz98OzJsXWFKYkwkaXIpYTshSH4MMU13anguMzx1HyteNx5yN3skNG1DP08-UXrEbEgcZWlzGn0Pakp_tg', '2025-08-13 12:26:57'),
(48, 'HN00000012', '1104500037699', '0958425523', '$2b$10$k5ELlIS995tRiQHOZ3SZUOXekajEE49BD1yV7z8reU.la/zl/.K7m', '2025-08-19 10:50:02.000', 'Tyn', '2025-08-19', 'นาย', 'U16c3160e9728a10f5af7fcc77a04eaec', 'user', 'tr', NULL, '2025-08-19 03:58:28'),
(49, 'HN00000013', '1129901789001', '0991044639', '$2b$10$wLLFBCGD9MsEab2yyZCJkeJN1CJfwnuIjBHWqHomnRbnvB91amOsC', '2025-08-20 20:42:04.000', 'Paramest Suetrong ', '2025-08-20', 'นาย', 'Ua9383f87bbaae8e81e1681413e164ce0', 'user', '(B) â¢Nâ¢Uâ¢T', 'https://profile.line-scdn.net/0hiXNWNlPWNndjLiPslAhICBN-NR1AX29lGksqE18rbkIJTHUlS0xwRFQsYU5cFyMjTkkrRlYmbxNvPUERfXjKQ2Qea0ZfGHMgRkhxmQ', '2025-08-20 13:43:51'),
(50, 'HN00000014', '1309802814890', '0641815842', '$2b$10$uzqXKNi7FVqJcmUMCSoncuXuiqXq6Km8b.3cBjNieBA0M6UQyhtuG', '2025-08-23 23:11:16.000', 'จันดี ดีใจ', '1978-12-23', 'นาย', NULL, 'user', NULL, NULL, '2025-08-23 16:11:16'),
(51, 'HN00000015', '1234567890123', '0987654321', '$2b$10$M.fRqrjj9/Ty3fMMwqQ41u12BrKldpONyL5fEinpyAonE2rvn/fZK', '2025-08-27 01:19:49.000', 'ขนมต้ม วันจัน', '1977-04-27', 'นาย', 'U820d58c1ca13db2f201f8329239c82fd', 'user', 'ððð', 'https://profile.line-scdn.net/0h2ea3ZIChbUpMSn70S5wTNTwabiBvOzRYYyonLHodNnMjfCgYYCsgLixINHMjfCgfZikjK3pDOylAWRosUhyRfkt6MHtwfCgdaSwqpA', '2025-08-27 04:44:32'),
(55, 'HN00000016', '1234524680246', '0987654321', '$2b$10$FJk7aDOW0duJ9H5OOMLhN.qfANyMyMRsb/bH4pribSRZksYvahjkG', '2025-09-15 21:58:01.000', 'ยามีน ยามาว', '2003-09-11', 'นาย', NULL, 'user', NULL, NULL, '2025-09-15 14:58:01');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `slot_id` (`slot_id`),
  ADD KEY `idx_bookings_read_status` (`is_read_by_admin`,`status`);

--
-- Indexes for table `consent_logs`
--
ALTER TABLE `consent_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_citizen_purpose` (`citizen_id`,`purpose`),
  ADD KEY `idx_citizen_purpose` (`citizen_id`,`purpose`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_latest` (`citizen_id`,`purpose`,`accepted_at`,`id`);

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
  ADD UNIQUE KEY `hn` (`hn`),
  ADD UNIQUE KEY `line_id` (`line_id`),
  ADD UNIQUE KEY `uniq_line_id` (`line_id`),
  ADD KEY `idx_user_line_id` (`line_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=331;

--
-- AUTO_INCREMENT for table `consent_logs`
--
ALTER TABLE `consent_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=487;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `slots`
--
ALTER TABLE `slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
