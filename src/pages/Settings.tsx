import { useState, useEffect } from "react";
import {
  User as UserIcon,
  Globe,
  Key,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Users,
  Shield,
  Camera,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import type { User as UserModel } from "../contexts/UserContext";
import { useAuth } from "../contexts/AuthContext";
import { mockUser } from "../data/mockData";
import toast from "react-hot-toast";
import NodeProfileClean from "./NodeProfileClean";
import { useSearchParams } from "react-router-dom";

export default function Settings() {
  const { user: userContextUser, setUser: setUserContext } = useUser();
  const {
    api,
    logout,
    user: authUser,
    setUser: setAuthUser,
    token: accessToken,
  } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial tab from URL parameter
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || "profile";
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // prefer the authenticated user when available
  const user: Partial<UserModel> | null =
    (authUser as unknown as Partial<UserModel>) ?? userContextUser ?? null;

  type NotificationKey = "email" | "push" | "sms" | "marketing";
  const [notifications, setNotifications] = useState<
    Record<NotificationKey, boolean>
  >({
    email: true,
    push: false,
    sms: false,
    marketing: true,
  });

  const tabs = [
    { id: "profile", name: "User Profile", icon: UserIcon },
    { id: "nodes", name: "Nodes & Profile", icon: Globe },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-6">
        <div className="relative flex ">
          <img
            src={user?.avatar || mockUser[0]?.avatar}
            alt="Profile"
            className="w-auto h-36 rounded-full mb-4 "
          />
          {/* <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
            <Upload className="w-4 h-4" />
          </button> */}
        </div>
        {/* <div>
          <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
          <p className="text-sm text-gray-500">Update your profile photo and personal details</p>
        </div> */}
      </div>

      {/* Profile Form - editable fields */}
      <EditableProfileForm />
    </div>
  );

  function EditableProfileForm() {
    // Normalize profile values from AuthContext (authUser), UserContext (userContextUser) and mock data
    const mock = mockUser[0];
    const auth = authUser as unknown as
      | {
          name?: string;
          email?: string;
          avatarUrl?: string;
          metadata?: Record<string, unknown>;
        }
      | undefined;
    const getProp = <T, K extends string>(
      obj: unknown,
      key: K
    ): T | undefined => {
      if (obj && typeof obj === "object" && key in obj)
        return (obj as Record<string, unknown>)[key] as T | undefined;
      return undefined;
    };
    const userCtx = userContextUser as Partial<UserModel> | undefined;

    const profile = {
      firstname:
        userCtx?.firstname ??
        (auth?.name ? String(auth.name).split(" ")[0] : undefined) ??
        mock.firstname,
      lastname:
        userCtx?.lastname ??
        (auth?.name
          ? String(auth.name).split(" ").slice(1).join(" ")
          : undefined) ??
        mock.lastname,
      email: userCtx?.email ?? auth?.email ?? mock.email,
      phoneNumber:
        userCtx?.phoneNumber ??
        getProp<string, "phoneNumber">(auth, "phoneNumber") ??
        auth?.metadata?.phoneNumber ??
        auth?.metadata?.phone ??
        undefined,
      roles:
        userCtx?.roles ??
        (Array.isArray(auth?.metadata?.roles)
          ? auth!.metadata!.roles
          : auth?.metadata?.roles
          ? [String(auth!.metadata!.roles)]
          : mock.roles),
      haloId: userCtx?.haloId ?? auth?.metadata?.haloId ?? mock.haloId,
      tenantId: userCtx?.tenantId ?? auth?.metadata?.tenantId ?? mock.tenantId,
      isEmailVerified:
        userCtx?.isEmailVerified ??
        auth?.metadata?.isEmailVerified ??
        mock.isEmailVerified,
      isPhoneVerified:
        userCtx?.isPhoneVerified ??
        auth?.metadata?.isPhoneVerified ??
        mock.isPhoneVerified,
      isSuper: userCtx?.isSuper ?? auth?.metadata?.isSuper ?? mock.isSuper,
      avatar: userCtx?.avatar ?? auth?.avatarUrl ?? mock.avatar,
      createdAt:
        userCtx?.createdAt ??
        getProp<string, "createdAt">(auth, "createdAt") ??
        undefined,
    } as Partial<UserModel & Record<string, unknown>>;

    // Enhanced form state with more fields
    const [firstname, setFirstname] = useState(profile.firstname ?? "");
    const [lastname, setLastname] = useState(profile.lastname ?? "");
    const [emailVal, setEmailVal] = useState(profile.email ?? "");
    const [phone, setPhone] = useState(profile.phoneNumber ?? "");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [occupation, setOccupation] = useState("");
    const [company, setCompany] = useState("");
    const [bio, setBio] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);

    const memberSince = profile?.createdAt
      ? new Date(String(profile.createdAt)).toLocaleDateString()
      : null;

    const handleSave = async () => {
      if (!user?.id) return toast.error("No user ID available");

      setLoadingSave(true);
      try {
        // Debug: see API request interceptor logs for token presence
        const payload: Record<string, unknown> = {
          email: emailVal,
          firstname: firstname,
          lastname: lastname,
          phoneNumber: phone,
        };

        // Debug: log access token presence before sending request
        console.debug("[Settings] accessToken present:", Boolean(accessToken));
        // Ensure we attempt a refresh (guards/backoff applied) before PATCH so server will accept Authorization if returned
        try {
          const doRefresh = (api as any)?._doRefresh as
            | (() => Promise<any>)
            | undefined;
          if (doRefresh) {
            await doRefresh();
          } else {
            // fallback: call refresh endpoint directly
            await api.post(
              "/auth/refresh-tokens",
              {},
              { withCredentials: true }
            );
          }
        } catch (refreshErr) {
          console.warn("[Settings] refresh before save failed", refreshErr);
          // If refresh fails, log user out to surface re-auth requirement
          logout();
          toast.error("Session expired — please sign in again");
          setLoadingSave(false);
          return;
        }

        // Use Axios instance from AuthContext which will attach the access token and handle refresh
        const resp = await api.patch(`/users/${user.id}`, payload);
        const updated = resp.data as Partial<UserModel>;
        const merged = { ...(userContextUser ?? {}), ...updated } as UserModel;
        // update both contexts where available
        setUserContext(merged);
        // AuthContext user shape may differ; set it if available
        if (typeof setAuthUser === "function")
          setAuthUser(merged as unknown as UserModel);
        toast.success("Profile updated");
      } catch (err: unknown) {
        let msg = "Update failed";
        if (err instanceof Error) msg = err.message;
        // If the refresh token is missing the API factory throws a specific error
        if (
          typeof msg === "string" &&
          msg.includes("No refresh token available")
        ) {
          // Clear auth state and prompt for sign-in
          logout();
          toast.error("Session expired — please sign in again");
        } else {
          toast.error(msg);
        }
      } finally {
        setLoadingSave(false);
      }
    };

    return (
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={profile.avatar || mockUser[0]?.avatar}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-700 shadow-lg"
                />
                <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {firstname} {lastname}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{emailVal}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    Member since {memberSince ?? "Unknown"}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Shield className="w-4 h-4 mr-1" />
                    {profile.isSuper ? "Admin" : "Member"}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <input
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Occupation
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your occupation"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Address Information
            </h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your street address"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!isEditing}
                  placeholder="City"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={!isEditing}
                  placeholder="State"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={!isEditing}
                  placeholder="ZIP Code"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <Building className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Professional Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your company name"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <select
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                <option value="">Select your role</option>
                <option value="member">Member</option>
                <option value="volunteer">Volunteer</option>
                <option value="leader">Leader</option>
                <option value="pastor">Pastor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={!isEditing}
              rows={4}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed resize-none"
            />
          </div>
        </div>

        {/* Account Status Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Account Status
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Email Verified
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your email address is verified
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span
                  className={`inline-block w-3 h-3 mr-2 rounded-full ${
                    user?.isEmailVerified ?? profile?.isEmailVerified
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-sm">
                  {user?.isEmailVerified ?? profile?.isEmailVerified
                    ? "Yes"
                    : "No"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Phone Verified
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your phone number is verified
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span
                  className={`inline-block w-3 h-3 mr-2 rounded-full ${
                    user?.isPhoneVerified ?? profile?.isPhoneVerified
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-sm">
                  {user?.isPhoneVerified ?? profile?.isPhoneVerified
                    ? "Yes"
                    : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loadingSave}
              className={`flex items-center px-6 py-3 rounded-lg text-white transition-colors ${
                loadingSave
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}>
              <Save className="w-4 h-4 mr-2" />
              {loadingSave ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Email Notifications
        </h3>
        <div className="space-y-4">
          {(
            [
              {
                key: "email",
                label: "Email notifications",
                description: "Receive email updates about your projects",
              },
              {
                key: "marketing",
                label: "Marketing emails",
                description: "Receive emails about new features and updates",
              },
            ] as const
          ).map((item) => {
            type NotificationItem = {
              key: NotificationKey;
              label: string;
              description: string;
            };
            const it = item as unknown as NotificationItem;
            const k = it.key as NotificationKey;
            return (
              <div key={k} className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {it.label}
                  </h4>
                  <p className="text-sm text-gray-500">{it.description}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({ ...prev, [k]: !prev[k] }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[k] ? "bg-blue-600" : "bg-gray-200"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[k] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Push Notifications
        </h3>
        <div className="space-y-4">
          {(
            [
              {
                key: "push",
                label: "Push notifications",
                description: "Receive push notifications on your devices",
              },
              {
                key: "sms",
                label: "SMS notifications",
                description: "Receive SMS updates for urgent matters",
              },
            ] as const
          ).map((item) => {
            type NotificationItem = {
              key: NotificationKey;
              label: string;
              description: string;
            };
            const it = item as unknown as NotificationItem;
            const k = it.key as NotificationKey;
            return (
              <div key={k} className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {it.label}
                  </h4>
                  <p className="text-sm text-gray-500">{it.description}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({ ...prev, [k]: !prev[k] }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[k] ? "bg-blue-600" : "bg-gray-200"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[k] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/*<div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Two-factor authentication</h4>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Enable
            </button>
          </div>
        </div>
      </div> */}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Keys</h3>
        <div className="space-y-3">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Production API Key
                </h4>
                <p className="text-sm text-gray-500 font-mono">
                  sk_live_****************************
                </p>
              </div>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Key className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 transition-colors">
            + Generate New API Key
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Light", description: "Clean and minimal light theme" },
            { name: "Dark", description: "Easy on the eyes dark theme" },
            { name: "System", description: "Adapts to your system settings" },
          ].map((theme) => (
            <div
              key={theme.name}
              className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  {theme.name}
                </h4>
                <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-500">{theme.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Language</h3>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>English (US)</option>
          <option>English (UK)</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
        </select>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Timezone</h3>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>Pacific Time (PT)</option>
          <option>Mountain Time (MT)</option>
          <option>Central Time (CT)</option>
          <option>Eastern Time (ET)</option>
        </select>
      </div>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Connected Apps
        </h3>
        <div className="space-y-4">
          {[
            {
              name: "Slack",
              description: "Team communication",
              connected: true,
            },
            {
              name: "Google Drive",
              description: "File storage and sharing",
              connected: true,
            },
            {
              name: "Trello",
              description: "Project management",
              connected: false,
            },
            {
              name: "GitHub",
              description: "Code repository",
              connected: false,
            },
          ].map((app) => (
            <div
              key={app.name}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {app.name}
                </h4>
                <p className="text-sm text-gray-500">{app.description}</p>
              </div>
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  app.connected
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}>
                {app.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Export your data
              </h4>
              <p className="text-sm text-gray-500">
                Download a copy of all your data
              </p>
            </div>
            <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNodeProfileTab = () => (
    <div className="space-y-6">
      <NodeProfileClean />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage your account preferences and settings
        </p>
      </div>

      {/* Horizontal Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}>
              <div className="flex items-center space-x-2">
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "nodes" && renderNodeProfileTab()}
      </div>
    </div>
  );
}
