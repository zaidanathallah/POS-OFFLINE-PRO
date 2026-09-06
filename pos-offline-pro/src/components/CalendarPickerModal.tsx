import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react-native";

interface CalendarPickerModalProps {
  visible: boolean;
  mode?: "single" | "range";
  initialDate?: string; // YYYY-MM-DD
  initialStartDate?: string; // YYYY-MM-DD
  initialEndDate?: string; // YYYY-MM-DD
  onConfirmSingle?: (date: string) => void;
  onConfirmRange?: (startDate: string, endDate: string) => void;
  onClose: () => void;
  title?: string;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const WEEKDAY_NAMES = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

export function CalendarPickerModal({
  visible,
  mode = "single",
  initialDate,
  initialStartDate,
  initialEndDate,
  onConfirmSingle,
  onConfirmRange,
  onClose,
  title,
}: CalendarPickerModalProps) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const todayStr = getTodayStr();

  // Internal State
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-indexed

  // Single Selection
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);

  // Range Selection
  const [rangeStart, setRangeStart] = useState<string>(initialStartDate || todayStr);
  const [rangeEnd, setRangeEnd] = useState<string>(initialEndDate || todayStr);
  const [isPickingEnd, setIsPickingEnd] = useState<boolean>(false);

  // Selector dropdowns
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      const baseDateStr = mode === "single" ? initialDate || todayStr : initialStartDate || todayStr;
      const parts = baseDateStr.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y)) setCurrentYear(y);
        if (!isNaN(m) && m >= 0 && m <= 11) setCurrentMonth(m);
      }
      if (mode === "single") {
        setSelectedDate(initialDate || todayStr);
      } else {
        setRangeStart(initialStartDate || todayStr);
        setRangeEnd(initialEndDate || todayStr);
        setIsPickingEnd(false);
      }
      setShowMonthPicker(false);
      setShowYearPicker(false);
    }
  }, [visible, initialDate, initialStartDate, initialEndDate, mode]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Generate dynamic year list (from 2020 to currentYear + 10)
  const currentRealYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 20 }, (_, i) => currentRealYear - 7 + i);

  // Calculate calendar days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const startDayOfWeek = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthTotalDays = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  );

  // Calendar cells
  const calendarCells: {
    day: number;
    month: number;
    year: number;
    dateStr: string;
    isCurrentMonth: boolean;
  }[] = [];

  // 1. Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarCells.push({
      day,
      month: m,
      year: y,
      dateStr: `${y}-${pad(m + 1)}-${pad(day)}`,
      isCurrentMonth: false,
    });
  }

  // 2. Current month days
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push({
      day: d,
      month: currentMonth,
      year: currentYear,
      dateStr: `${currentYear}-${pad(currentMonth + 1)}-${pad(d)}`,
      isCurrentMonth: true,
    });
  }

  // 3. Next month leading days (fill up to 35 or 42 cells)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  const targetTotal = calendarCells.length + remainingCells < 35 ? 35 : calendarCells.length + remainingCells;
  const nextMonthFillCount = targetTotal - calendarCells.length;

  for (let d = 1; d <= nextMonthFillCount; d++) {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarCells.push({
      day: d,
      month: m,
      year: y,
      dateStr: `${y}-${pad(m + 1)}-${pad(d)}`,
      isCurrentMonth: false,
    });
  }

  const handleCellPress = (cellDateStr: string) => {
    if (mode === "single") {
      setSelectedDate(cellDateStr);
    } else {
      if (!isPickingEnd) {
        // Setting start date
        setRangeStart(cellDateStr);
        setRangeEnd(cellDateStr);
        setIsPickingEnd(true);
      } else {
        // Setting end date
        if (cellDateStr < rangeStart) {
          setRangeStart(cellDateStr);
          setRangeEnd(rangeStart);
        } else {
          setRangeEnd(cellDateStr);
        }
        setIsPickingEnd(false);
      }
    }
  };

  const handleConfirm = () => {
    if (mode === "single") {
      if (onConfirmSingle) onConfirmSingle(selectedDate);
    } else {
      if (onConfirmRange) {
        const finalStart = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
        const finalEnd = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
        onConfirmRange(finalStart, finalEnd);
      }
    }
    onClose();
  };

  // Quick Preset Handlers
  const handleQuickPreset = (preset: "today" | "yesterday" | "last7" | "thisMonth") => {
    const now = new Date();
    if (preset === "today") {
      if (mode === "single") {
        setSelectedDate(todayStr);
      } else {
        setRangeStart(todayStr);
        setRangeEnd(todayStr);
      }
    } else if (preset === "yesterday") {
      const yDate = new Date(now);
      yDate.setDate(now.getDate() - 1);
      const yStr = `${yDate.getFullYear()}-${pad(yDate.getMonth() + 1)}-${pad(yDate.getDate())}`;
      if (mode === "single") {
        setSelectedDate(yStr);
      } else {
        setRangeStart(yStr);
        setRangeEnd(yStr);
      }
    } else if (preset === "last7") {
      const sDate = new Date(now);
      sDate.setDate(now.getDate() - 6);
      const sStr = `${sDate.getFullYear()}-${pad(sDate.getMonth() + 1)}-${pad(sDate.getDate())}`;
      if (mode === "single") {
        setSelectedDate(todayStr);
      } else {
        setRangeStart(sStr);
        setRangeEnd(todayStr);
      }
    } else if (preset === "thisMonth") {
      const sStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      if (mode === "single") {
        setSelectedDate(todayStr);
      } else {
        setRangeStart(sStr);
        setRangeEnd(todayStr);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Card Header matching Gambar 3 */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleText}>
                {title || (mode === "single" ? "Select Date" : "Select Date Range")}
              </Text>
              <Text style={styles.subtitleText}>
                {mode === "single"
                  ? `Terpilih: ${selectedDate}`
                  : `Rentang: ${rangeStart} s/d ${rangeEnd}`}
              </Text>
            </View>

            {/* Calendar Badge Icon from Gambar 3 */}
            <View style={styles.calendarBadge}>
              <View style={styles.badgeTopBar} />
              <Text style={styles.badgeNumber}>
                {mode === "single"
                  ? selectedDate.split("-")[2] || "01"
                  : rangeStart.split("-")[2] || "01"}
              </Text>
            </View>
          </View>

          {/* Month & Year Selectors Bar */}
          <View style={styles.navigationBar}>
            {/* Month Dropdown Button */}
            <TouchableOpacity
              onPress={() => {
                setShowMonthPicker(!showMonthPicker);
                setShowYearPicker(false);
              }}
              activeOpacity={0.7}
              style={styles.dropdownButton}
            >
              <Text style={styles.dropdownText}>{MONTH_NAMES[currentMonth]}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {/* Year Dropdown Button */}
            <TouchableOpacity
              onPress={() => {
                setShowYearPicker(!showYearPicker);
                setShowMonthPicker(false);
              }}
              activeOpacity={0.7}
              style={styles.dropdownButton}
            >
              <Text style={styles.dropdownText}>{currentYear}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {/* Nav Arrows */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.arrowButton}
                activeOpacity={0.7}
              >
                <ChevronLeft size={18} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.arrowButton}
                activeOpacity={0.7}
              >
                <ChevronRight size={18} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Month Selection Grid Overlay */}
          {showMonthPicker && (
            <View style={styles.selectorGridOverlay}>
              <Text style={styles.selectorGridTitle}>PILIH BULAN</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {MONTH_NAMES.map((mName, idx) => {
                  const isSelected = currentMonth === idx;
                  return (
                    <TouchableOpacity
                      key={mName}
                      onPress={() => {
                        setCurrentMonth(idx);
                        setShowMonthPicker(false);
                      }}
                      style={[
                        styles.selectorGridItem,
                        isSelected && { backgroundColor: "#0097A7", borderColor: "#0097A7" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectorGridItemText,
                          isSelected && { color: "#FFFFFF", fontWeight: "800" },
                        ]}
                      >
                        {mName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Year Selection Grid Overlay */}
          {showYearPicker && (
            <View style={styles.selectorGridOverlay}>
              <Text style={styles.selectorGridTitle}>PILIH TAHUN</Text>
              <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {availableYears.map((yr) => {
                    const isSelected = currentYear === yr;
                    return (
                      <TouchableOpacity
                        key={yr}
                        onPress={() => {
                          setCurrentYear(yr);
                          setShowYearPicker(false);
                        }}
                        style={[
                          styles.selectorGridItem,
                          isSelected && { backgroundColor: "#0097A7", borderColor: "#0097A7" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectorGridItemText,
                            isSelected && { color: "#FFFFFF", fontWeight: "800" },
                          ]}
                        >
                          {yr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Weekday Labels (SUN, MON, TUE, WED, THU, FRI, SAT) */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_NAMES.map((wk, idx) => (
              <View key={wk} style={styles.weekdayCell}>
                <Text
                  style={[
                    styles.weekdayText,
                    (idx === 0 || idx === 6) && { color: "#F97316" }, // Highlight weekend
                  ]}
                >
                  {wk}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Day Grid */}
          <View style={styles.daysGrid}>
            {calendarCells.map((cell, idx) => {
              let isSelected = false;
              let isStart = false;
              let isEnd = false;
              let isInRange = false;

              if (mode === "single") {
                isSelected = cell.dateStr === selectedDate;
              } else {
                isStart = cell.dateStr === rangeStart;
                isEnd = cell.dateStr === rangeEnd;
                isSelected = isStart || isEnd;
                const minD = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
                const maxD = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
                isInRange = cell.dateStr >= minD && cell.dateStr <= maxD;
              }

              const isToday = cell.dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={`${cell.dateStr}-${idx}`}
                  onPress={() => handleCellPress(cell.dateStr)}
                  activeOpacity={0.7}
                  style={[
                    styles.dayCell,
                    isInRange && !isSelected && styles.dayCellInRange,
                  ]}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isSelected && styles.dayCircleSelected,
                      isToday && !isSelected && styles.dayCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !cell.isCurrentMonth && styles.dayTextDimmed,
                        isSelected && styles.dayTextSelected,
                        isToday && !isSelected && styles.dayTextToday,
                      ]}
                    >
                      {pad(cell.day)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Shortcuts */}
          <View style={styles.presetRow}>
            <TouchableOpacity
              onPress={() => handleQuickPreset("today")}
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}>Hari Ini</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleQuickPreset("yesterday")}
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}>Kemarin</Text>
            </TouchableOpacity>
            {mode === "range" && (
              <>
                <TouchableOpacity
                  onPress={() => handleQuickPreset("last7")}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetChipText}>7 Hari</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleQuickPreset("thisMonth")}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetChipText}>Bulan Ini</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Action Buttons: Confirm & Cancel */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.85}
              style={styles.confirmButton}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirm / Terapkan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    padding: 16,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#18181B",
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0097A7",
    marginTop: 2,
  },
  calendarBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "#EA580C",
  },
  badgeNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 6,
  },
  navigationBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F4F4F5",
    borderRadius: 14,
    padding: 6,
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#18181B",
    marginRight: 6,
  },
  dropdownArrow: {
    fontSize: 8,
    color: "#71717A",
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  selectorGridOverlay: {
    position: "absolute",
    top: 130,
    left: 20,
    right: 20,
    zIndex: 99,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  selectorGridTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#71717A",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  selectorGridItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F4F4F5",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  selectorGridItemText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3F3F46",
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A1A1AA",
    letterSpacing: 0.5,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dayCell: {
    width: "14.28%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 1,
  },
  dayCellInRange: {
    backgroundColor: "#ECFEFF",
    borderRadius: 8,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleSelected: {
    backgroundColor: "#0097A7",
    shadowColor: "#0097A7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: "#0097A7",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#27272A",
  },
  dayTextDimmed: {
    color: "#D4D4D8",
    fontWeight: "500",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dayTextToday: {
    color: "#0097A7",
    fontWeight: "800",
  },
  presetRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F4F4F5",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#52525B",
  },
  footerActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#52525B",
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#0097A7",
    shadowColor: "#0097A7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    marginLeft: 6,
  },
});
