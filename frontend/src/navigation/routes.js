// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Home
import HomeScreen from '../screens/home/HomeScreen';

// Products
import ProductsListScreen from '../screens/products/ProductsListScreen';
import ProductDetailsScreen from '../screens/products/ProductDetailsScreen';

// Orders
import OrderSummaryScreen from '../screens/orders/OrderSummaryScreen';
import OrderHistoryScreen from '../screens/orders/OrderHistoryScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import TrackShipmentScreen from '../screens/orders/TrackShipmentScreen';
import ReportIssueScreen from '../screens/orders/ReportIssueScreen';
import IssueSubmittedScreen from '../screens/orders/IssueSubmittedScreen';
import IssueStatusScreen from '../screens/orders/IssueStatusScreen';
import CancelOrderScreen from '../screens/orders/CancelOrderScreen';
import OrderCancelledScreen from '../screens/orders/OrderCancelledScreen';

// Returns
import ReturnInitiationScreen from '../screens/returns/ReturnInitiationScreen';
import ReturnSubmittedScreen from '../screens/returns/ReturnSubmittedScreen';
import ReturnDetailsScreen from '../screens/returns/ReturnDetailsScreen';
import ReturnCancelledScreen from '../screens/returns/ReturnCancelledScreen';

// Payments
import PaymentScreen from '../screens/payment/PaymentScreen';
import OrderConfirmationScreen from '../screens/payment/OrderConfirmationScreen';
import AddCardScreen from '../screens/payment/AddCardScreen';
import DealerPaymentsScreen from '../screens/payment/DealerPaymentsScreen';

// Profile
import ProfileScreen from '../screens/profile/ProfileScreen';
import ContactDetailsScreen from '../screens/profile/ContactDetailsScreen';
import BankInfoScreen from '../screens/profile/BankInfoScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';

// Notifications
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

// Support
import ContactSupportScreen from '../screens/support/ContactSupportScreen';

// ---------------------------------------------------------------------------
// Route name constants — use these everywhere instead of raw strings so any
// rename is a single-place change and IDEs can autocomplete/refactor.
// ---------------------------------------------------------------------------
export const ROUTES = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',

  // Root
  MAIN_TABS: 'MainTabs',

  // Bottom tabs
  HOME: 'Home',
  PRODUCTS: 'Products',
  ORDER_HISTORY: 'OrderHistory',
  PAYMENT: 'Payment',   // shared name: tab → DealerPaymentsScreen, stack → PaymentScreen
  PROFILE: 'Profile',

  // Products
  PRODUCT_DETAILS: 'ProductDetails',

  // Order flow
  ORDER_SUMMARY: 'OrderSummary',
  ORDER_CONFIRMATION: 'OrderConfirmation',
  ADD_CARD: 'AddCard',

  // Order management
  ORDER_DETAILS: 'OrderDetails',
  TRACK_SHIPMENT: 'TrackShipment',
  REPORT_ISSUE: 'ReportIssue',
  ISSUE_SUBMITTED: 'IssueSubmitted',
  ISSUE_STATUS: 'IssueStatus',
  CANCEL_ORDER: 'CancelOrder',
  ORDER_CANCELLED: 'OrderCancelled',

  // Returns
  RETURN_INITIATION: 'ReturnInitiation',
  RETURN_SUBMITTED: 'ReturnSubmitted',
  RETURN_DETAILS: 'ReturnDetails',
  RETURN_CANCELLED: 'ReturnCancelled',

  // Profile sub-screens
  CONTACT_DETAILS: 'ContactDetails',
  BANK_INFO: 'BankInfo',
  CHANGE_PASSWORD: 'ChangePassword',
  NOTIFICATION_SETTINGS: 'NotificationSettings',
  LANGUAGE: 'Language',

  // Misc
  NOTIFICATIONS: 'Notifications',
  CONTACT_SUPPORT: 'ContactSupport',
};

// ---------------------------------------------------------------------------
// Linking config — maps route names to URL paths.
// On web  : keeps the browser URL bar in sync and enables page refresh to
//           land on the correct screen (URL-based persistence).
// On native: enables deep-link URLs like dealer-app://orders/123.
// ---------------------------------------------------------------------------
export const LINKING_CONFIG = {
  prefixes: ['dealer-app://'],   // native deep-link scheme; web uses window.location automatically

  config: {
    screens: {
      // ── Auth ──────────────────────────────────────────────────────────────
      [ROUTES.LOGIN]:    'login',
      [ROUTES.REGISTER]: 'register',

      // ── Authenticated ─────────────────────────────────────────────────────
      [ROUTES.MAIN_TABS]: {
        path: '',
        screens: {
          [ROUTES.HOME]:          '',
          [ROUTES.PRODUCTS]:      'products',
          [ROUTES.ORDER_HISTORY]: 'orders',
          [ROUTES.PAYMENT]:       'payments',   // tab → DealerPaymentsScreen
          [ROUTES.PROFILE]:       'profile',
        },
      },

      // Products
      [ROUTES.PRODUCT_DETAILS]: 'products/:productId',

      // Order flow
      [ROUTES.ORDER_SUMMARY]:     'checkout/summary',
      [ROUTES.PAYMENT]:           'checkout/payment',  // stack → PaymentScreen
      [ROUTES.ORDER_CONFIRMATION]:'checkout/confirmation',
      [ROUTES.ADD_CARD]:          'checkout/add-card',

      // Order management
      [ROUTES.ORDER_DETAILS]:   'orders/:orderId',
      [ROUTES.TRACK_SHIPMENT]:  'orders/:orderId/track',
      [ROUTES.REPORT_ISSUE]:    'orders/:orderId/issue',
      [ROUTES.ISSUE_SUBMITTED]: 'orders/issue-submitted',
      [ROUTES.ISSUE_STATUS]:    'orders/issue-status',
      [ROUTES.CANCEL_ORDER]:    'orders/:orderId/cancel',
      [ROUTES.ORDER_CANCELLED]: 'orders/cancelled',

      // Returns
      [ROUTES.RETURN_INITIATION]: 'returns/new',
      [ROUTES.RETURN_SUBMITTED]:  'returns/submitted',
      [ROUTES.RETURN_DETAILS]:    'returns/:returnId',
      [ROUTES.RETURN_CANCELLED]:  'returns/cancelled',

      // Profile sub-screens
      [ROUTES.CONTACT_DETAILS]:       'profile/contact',
      [ROUTES.BANK_INFO]:             'profile/bank',
      [ROUTES.CHANGE_PASSWORD]:       'profile/password',
      [ROUTES.NOTIFICATION_SETTINGS]: 'profile/notifications',
      [ROUTES.LANGUAGE]:              'profile/language',

      // Misc
      [ROUTES.NOTIFICATIONS]:   'notifications',
      [ROUTES.CONTACT_SUPPORT]: 'support',
    },
  },
};

// ---------------------------------------------------------------------------
// Auth stack screens
// ---------------------------------------------------------------------------
export const AUTH_SCREENS = [
  { name: ROUTES.LOGIN,    component: LoginScreen },
  { name: ROUTES.REGISTER, component: RegisterScreen },
];

// ---------------------------------------------------------------------------
// Bottom tab screens  (label + icon are tab-bar specific options)
// ---------------------------------------------------------------------------
export const TAB_SCREENS = [
  { name: ROUTES.HOME,          component: HomeScreen,          label: 'Home',    icon: '🏠' },
  { name: ROUTES.PRODUCTS,      component: ProductsListScreen,  label: 'Products', icon: '📦' },
  { name: ROUTES.ORDER_HISTORY, component: OrderHistoryScreen,  label: 'Orders',  icon: '📋' },
  { name: ROUTES.PAYMENT,       component: DealerPaymentsScreen, label: 'Payment', icon: '💳' },
  { name: ROUTES.PROFILE,       component: ProfileScreen,       label: 'Profile', icon: '👤' },
];

// ---------------------------------------------------------------------------
// App (authenticated) stack screens — excludes MainTabs (added separately)
// ---------------------------------------------------------------------------
export const APP_SCREENS = [
  // Products
  { name: ROUTES.PRODUCT_DETAILS,   component: ProductDetailsScreen },

  // Order flow
  { name: ROUTES.ORDER_SUMMARY,     component: OrderSummaryScreen },
  { name: ROUTES.PAYMENT,           component: PaymentScreen },
  { name: ROUTES.ORDER_CONFIRMATION, component: OrderConfirmationScreen },
  { name: ROUTES.ADD_CARD,          component: AddCardScreen },

  // Order management
  { name: ROUTES.ORDER_DETAILS,     component: OrderDetailsScreen },
  { name: ROUTES.TRACK_SHIPMENT,    component: TrackShipmentScreen },
  { name: ROUTES.REPORT_ISSUE,      component: ReportIssueScreen },
  { name: ROUTES.ISSUE_SUBMITTED,   component: IssueSubmittedScreen },
  { name: ROUTES.ISSUE_STATUS,      component: IssueStatusScreen },
  { name: ROUTES.CANCEL_ORDER,      component: CancelOrderScreen },
  { name: ROUTES.ORDER_CANCELLED,   component: OrderCancelledScreen },

  // Returns
  { name: ROUTES.RETURN_INITIATION, component: ReturnInitiationScreen },
  { name: ROUTES.RETURN_SUBMITTED,  component: ReturnSubmittedScreen },
  { name: ROUTES.RETURN_DETAILS,    component: ReturnDetailsScreen },
  { name: ROUTES.RETURN_CANCELLED,  component: ReturnCancelledScreen },

  // Profile sub-screens
  { name: ROUTES.CONTACT_DETAILS,       component: ContactDetailsScreen },
  { name: ROUTES.BANK_INFO,             component: BankInfoScreen },
  { name: ROUTES.CHANGE_PASSWORD,       component: ChangePasswordScreen },
  { name: ROUTES.NOTIFICATION_SETTINGS, component: NotificationSettingsScreen },
  { name: ROUTES.LANGUAGE,              component: LanguageScreen },

  // Misc
  { name: ROUTES.NOTIFICATIONS,    component: NotificationsScreen },
  { name: ROUTES.CONTACT_SUPPORT,  component: ContactSupportScreen },
];
