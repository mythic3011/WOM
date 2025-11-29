export const calculationService = {
    calculateSeatCapacity(layout) {
        if (!layout || !layout.sections) {return 0;}

        return layout.sections.reduce((total, section) => {
            const skipIndices = section.seatNumbering?.skipSeatIndices || [];
            const effectiveSeatsPerRow = section.seatsPerRow - skipIndices.length;
            return total + section.rows * effectiveSeatsPerRow;
        }, 0);
    },

    calculateRevenue(bookings) {
        if (!bookings || bookings.length === 0) {
            return {
                total: 0,
                count: 0,
                average: 0,
                byStatus: {},
            };
        }

        const result = {
            total: 0,
            count: bookings.length,
            average: 0,
            byStatus: {},
        };

        bookings.forEach((booking) => {
            const amount = booking.totalAmount || 0;
            result.total += amount;

            const status = booking.status || "unknown";
            if (!result.byStatus[status]) {
                result.byStatus[status] = { count: 0, total: 0 };
            }
            result.byStatus[status].count++;
            result.byStatus[status].total += amount;
        });

        result.average = result.count > 0 ? result.total / result.count : 0;

        return result;
    },

    calculatePercentage(value, total, decimals = 2) {
        if (!total || total === 0) {return 0;}
        const percentage = (value / total) * 100;
        return Number(percentage.toFixed(decimals));
    },

    calculateDiscount(price, discountRate) {
        if (!price || !discountRate) {return price;}

        if (discountRate <= 1) {
            return price * discountRate;
        }

        const discountPercentage = discountRate / 100;
        return price * (1 - discountPercentage);
    },

    formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return "$0.00";
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount)) {
            return "$0.00";
        }

        const formatted = numAmount.toFixed(2);
        const parts = formatted.split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        return `$${integerPart}.${parts[1]}`;
    },

    calculateDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            days: diffDays,
            weeks: Math.floor(diffDays / 7),
            months: Math.floor(diffDays / 30),
            startDate: start,
            endDate: end,
        };
    },

    calculateStatistics(data) {
        if (!data || data.length === 0) {
            return {
                count: 0,
                sum: 0,
                average: 0,
                min: 0,
                max: 0,
                median: 0,
            };
        }

        const numbers = data.filter((n) => typeof n === "number" && !isNaN(n));

        if (numbers.length === 0) {
            return {
                count: 0,
                sum: 0,
                average: 0,
                min: 0,
                max: 0,
                median: 0,
            };
        }

        const sum = numbers.reduce((acc, val) => acc + val, 0);
        const average = sum / numbers.length;
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median =
            sorted.length % 2 === 0
                ? (sorted[mid - 1] + sorted[mid]) / 2
                : sorted[mid];

        return {
            count: numbers.length,
            sum,
            average,
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            median,
        };
    },

    calculateBookingFees(basePrice, feeRate = 0.05) {
        const fees = basePrice * feeRate;
        return {
            basePrice,
            fees,
            total: basePrice + fees,
            feeRate: feeRate * 100,
        };
    },

    calculateTaxes(amount, taxRate = 0) {
        if (taxRate === 0) {
            return {
                subtotal: amount,
                tax: 0,
                total: amount,
                taxRate: 0,
            };
        }

        const tax = amount * taxRate;
        return {
            subtotal: amount,
            tax,
            total: amount + tax,
            taxRate: taxRate * 100,
        };
    },

    calculateOccupancyRate(bookedSeats, totalSeats) {
        if (!totalSeats || totalSeats === 0) {return 0;}
        return this.calculatePercentage(bookedSeats, totalSeats);
    },

    calculateAverageTicketPrice(totalRevenue, ticketsSold) {
        if (!ticketsSold || ticketsSold === 0) {return 0;}
        return totalRevenue / ticketsSold;
    },

    calculateGrowthRate(currentValue, previousValue) {
        if (!previousValue || previousValue === 0) {return 0;}
        const growth = ((currentValue - previousValue) / previousValue) * 100;
        return Number(growth.toFixed(2));
    },

    calculateRunningTotal(values) {
        let runningTotal = 0;
        return values.map((value) => {
            runningTotal += value;
            return runningTotal;
        });
    },

    calculateMovingAverage(values, windowSize = 7) {
        if (values.length < windowSize) {return values;}

        const result = [];
        for (let i = 0; i <= values.length - windowSize; i++) {
            const window = values.slice(i, i + windowSize);
            const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
            result.push(Number(average.toFixed(2)));
        }
        return result;
    },
};
