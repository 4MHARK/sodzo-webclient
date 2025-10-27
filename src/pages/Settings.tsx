import { useState } from "react";
import { User as UserIcon, Globe, Key, Download } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import type { User as UserModel } from "../contexts/UserContext";
import { useAuth } from "../contexts/AuthContext";
import { mockUser } from "../data/mockData";
import toast from "react-hot-toast";
import NodeProfileClean from "./NodeProfileClean";

export default function Settings() {
  const { user: userContextUser, setUser: setUserContext } = useUser();
  const {
    api,
    logout,
    user: authUser,
    setUser: setAuthUser,
    token: accessToken,
  } = useAuth();
  // prefer the authenticated user when available
  const user: Partial<UserModel> | null =
    (authUser as unknown as Partial<UserModel>) ?? userContextUser ?? null;
  const [activeTab, setActiveTab] = useState("profile");
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
    { id: "Node Profile", name: "Node Profile", icon: Globe },
    // { id: 'notifications', name: 'Notifications', icon: Bell },
    // { id: 'security', name: 'Security', icon: Shield },
    // { id: 'appearance', name: 'Appearance', icon: Palette },
    // { id: 'integrations', name: 'Integrations', icon: Globe },
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
      key: K,
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
      // prefer explicit top-level phoneNumber from user/auth responses
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
      // prefer explicit createdAt timestamp from the API response
      createdAt:
        userCtx?.createdAt ??
        getProp<string, "createdAt">(auth, "createdAt") ??
        undefined,
    } as Partial<UserModel & Record<string, unknown>>;

    const [firstname, setFirstname] = useState(profile.firstname ?? "");
    const [lastname, setLastname] = useState(profile.lastname ?? "");
    const [emailVal, setEmailVal] = useState(profile.email ?? "");
    const [phone, setPhone] = useState(profile.phoneNumber ?? "");
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
              { withCredentials: true },
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Additional read-only fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Halo ID
            </label>
            <input
              type="text"
              value={user?.haloId ?? profile?.haloId ?? ""}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant ID
            </label>
            <input
              type="text"
              value={user?.tenantId ?? profile?.tenantId ?? ""}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Verified
            </label>
            <div className="flex items-center">
              <span
                className={`inline-block w-3 h-3 mr-2 rounded-full ${(user?.isEmailVerified ?? profile?.isEmailVerified) ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-sm">
                {(user?.isEmailVerified ?? profile?.isEmailVerified)
                  ? "Yes"
                  : "No"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Verified
            </label>
            <div className="flex items-center">
              <span
                className={`inline-block w-3 h-3 mr-2 rounded-full ${(user?.isPhoneVerified ?? profile?.isPhoneVerified) ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-sm">
                {(user?.isPhoneVerified ?? profile?.isPhoneVerified)
                  ? "Yes"
                  : "No"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin
          </label>
          <div
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            style={{
              background:
                (user?.isSuper ?? profile?.isSuper) ? "#ecfdf5" : "#fff1f2",
              color:
                (user?.isSuper ?? profile?.isSuper) ? "#065f46" : "#9f1239",
            }}
          >
            {(user?.isSuper ?? profile?.isSuper) ? "Admin" : "Not admin"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={emailVal}
            onChange={(e) => setEmailVal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <input
            type="text"
            defaultValue={user?.roles || mockUser[0]?.roles}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100"
          />
        </div>

        {memberSince && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member since
            </label>
            <div className="text-sm text-gray-700">{memberSince}</div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loadingSave}
            className={`px-4 py-2 rounded-lg text-white ${loadingSave ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {loadingSave ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    );
  }

  const renderNodeProfileTab = () => <NodeProfileClean />;

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
                  }`}
                >
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
                  }`}
                >
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
              className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
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
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
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
                }`}
              >
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {activeTab === "profile" && renderProfileTab()}
            {activeTab === "Node Profile" && renderNodeProfileTab()}
            {activeTab === "notifications" && renderNotificationsTab()}
            {activeTab === "security" && renderSecurityTab()}
            {activeTab === "appearance" && renderAppearanceTab()}
            {activeTab === "integrations" && renderIntegrationsTab()}

            {/* Save Button */}
            {/* <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Changes will be saved automatically
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
