# Tube Label Generator

[![DOI](svg)](doi)

Description

## Prerequisites
 - REDCap >= 14.0.2
 - PHP >= 8

## Easy installation

None! This module is not yet intended for public consumption.

## Manual Installation
- Clone this repo into to `<redcap-root>/modules/tube_label_generator_v0.0.0`.

## Introduction

TODO

## Global Configuration

N/A

## Project Configuration

- **Input Base**: The numeric base system of your input, usually 10
- **Output Base**: Up to 36, note that you will need to use an even number for the [checksum algorithm to work](https://en.wikipedia.org/wiki/Luhn_mod_N_algorithm#Limitation)

## Use

Go to the "Generate Labels" page.

