export interface ApiService {
  id: number;
  name: string;
  description: string | null;
  price: string;
  duration: number;
}

export interface ApiStaff {
  id: number;
  name: string;
  rating?: number;
  appointmentCount?: number;
  appointment_count_today?: number;
}

export interface BookingState {
  step: number;
  isLoading: boolean;
  error: string;
  success: boolean;
  allServices: ApiService[];
  availableStaff: ApiStaff[];
  selectedServices: ApiService[];
  selectedDate: Date | undefined;
  selectedTime: string;
  selectedStaffId: number | null;
  autoAssign: boolean;
  availabilityInfo: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  searchTerm: string;
  availableTimeSlots: string[];
}

export const initialState: BookingState = {
  step: 1,
  isLoading: false,
  error: "",
  success: false,
  allServices: [],
  availableStaff: [],
  selectedServices: [],
  selectedDate: undefined,
  selectedTime: "",
  selectedStaffId: null,
  autoAssign: true,
  availabilityInfo: null,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  notes: "",
  searchTerm: "",
  availableTimeSlots: [],
};

export type BookingAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_IS_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_SUCCESS"; payload: boolean }
  | { type: "SET_ALL_SERVICES"; payload: ApiService[] }
  | { type: "SET_AVAILABLE_STAFF"; payload: ApiStaff[] }
  | { type: "SET_SELECTED_SERVICES"; payload: ApiService[] }
  | { type: "TOGGLE_SERVICE"; payload: { service: ApiService; checked: boolean } }
  | { type: "CLEAR_SELECTED_SERVICES" }
  | { type: "SET_SELECTED_DATE"; payload: Date | undefined }
  | { type: "SET_SELECTED_TIME"; payload: string }
  | { type: "SET_SELECTED_STAFF_ID"; payload: number | null }
  | { type: "SET_AUTO_ASSIGN"; payload: boolean }
  | { type: "SET_AVAILABILITY_INFO"; payload: string | null }
  | { type: "SET_CUSTOMER_NAME"; payload: string }
  | { type: "SET_CUSTOMER_PHONE"; payload: string }
  | { type: "SET_CUSTOMER_EMAIL"; payload: string }
  | { type: "SET_NOTES"; payload: string }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_AVAILABLE_TIME_SLOTS"; payload: string[] }
  | { type: "RESET" };

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_IS_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_SUCCESS":
      return { ...state, success: action.payload };
    case "SET_ALL_SERVICES":
      return { ...state, allServices: action.payload };
    case "SET_AVAILABLE_STAFF":
      return { ...state, availableStaff: action.payload };
    case "SET_SELECTED_SERVICES":
      return { ...state, selectedServices: action.payload };
    case "TOGGLE_SERVICE": {
      const { service, checked } = action.payload;
      const selectedServices = checked
        ? [...state.selectedServices, service]
        : state.selectedServices.filter((s) => s.id !== service.id);
      return { ...state, selectedServices };
    }
    case "CLEAR_SELECTED_SERVICES":
      return { ...state, selectedServices: [] };
    case "SET_SELECTED_DATE":
      return {
        ...state,
        selectedDate: action.payload,
        selectedTime: "",
        availableTimeSlots: [],
        availableStaff: [],
        availabilityInfo: null,
      };
    case "SET_SELECTED_TIME":
      return { ...state, selectedTime: action.payload };
    case "SET_SELECTED_STAFF_ID":
      return { ...state, selectedStaffId: action.payload };
    case "SET_AUTO_ASSIGN":
      return { ...state, autoAssign: action.payload };
    case "SET_AVAILABILITY_INFO":
      return { ...state, availabilityInfo: action.payload };
    case "SET_CUSTOMER_NAME":
      return { ...state, customerName: action.payload };
    case "SET_CUSTOMER_PHONE":
      return { ...state, customerPhone: action.payload };
    case "SET_CUSTOMER_EMAIL":
      return { ...state, customerEmail: action.payload };
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_AVAILABLE_TIME_SLOTS":
      return { ...state, availableTimeSlots: action.payload };
    case "RESET":
      return {
        ...initialState,
        allServices: state.allServices, // Keep pre-loaded services list
      };
    default:
      return state;
  }
}
