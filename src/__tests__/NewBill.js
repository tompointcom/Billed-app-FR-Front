/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import storeMock from "../__mocks__/store.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    let newBill;
    let onNavigateMock;

    beforeEach(() => {
      document.body.innerHTML = NewBillUI();

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ email: 'employee@test.com' }));

      onNavigateMock = jest.fn();

      // Initialize NewBill
      newBill = new NewBill({
        document,
        onNavigate: onNavigateMock,
        store: storeMock,
        localStorage: window.localStorage,
      });

      // Mock updateBill
      newBill.updateBill = jest.fn();
      // Mock window.alert
      jest.spyOn(window, "alert").mockImplementation(() => {});
    });

    afterEach(() => {
      jest.clearAllMocks();
      window.localStorage.clear();
    });

    test("Then handleSubmit should call updateBill and onNavigate with correct arguments", async () => {
      // Fill the form
      fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Transports' } });
      fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'Vol Paris Londres' } });
      fireEvent.change(screen.getByTestId('amount'), { target: { value: '348' } });
      fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2023-10-10' } });
      fireEvent.change(screen.getByTestId('vat'), { target: { value: '70' } });
      fireEvent.change(screen.getByTestId('pct'), { target: { value: '20' } });
      fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'Voyage d\'affaires' } });

      // Set file properties
      newBill.fileUrl = 'https://example.com/file.jpg';
      newBill.fileName = 'file.jpg';

      console.log("localStorage content:", window.localStorage.getItem('user'));

      // Submit the form
      const form = screen.getByTestId('form-new-bill');
      fireEvent.submit(form);

      // Expected bill object
      const expectedBill = {
        email: 'employee@test.com',
        type: 'Transports',
        name: 'Vol Paris Londres',
        amount: 348,
        date: '2023-10-10',
        vat: '70',
        pct: 20,
        commentary: 'Voyage d\'affaires',
        fileUrl: 'https://example.com/file.jpg',
        fileName: 'file.jpg',
        status: 'pending',
      };
      await new Promise(resolve => setTimeout(resolve, 0));
      fireEvent.submit(form);

      // Assert updateBill was called with the expected bill
      expect(newBill.updateBill).toHaveBeenCalledWith(expectedBill);

      // Assert onNavigate was called with the correct route
      expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });
  });

  describe("When I am on NewBill Page and upload a file", () => {
    let newBill;
    let onNavigateMock;

    beforeEach(() => {
      document.body.innerHTML = NewBillUI();

      // Mock localStorage
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ email: "employee@test.com" })
      );

      onNavigateMock = jest.fn();

      // Initialize NewBill
      newBill = new NewBill({
        document,
        onNavigate: onNavigateMock,
        store: storeMock,
        localStorage: window.localStorage,
      });

      // Mock window.alert
      jest.spyOn(window, "alert").mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    test("Then handleChangeFile should be called when a file is uploaded", () => {
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const fileInput = screen.getByTestId("file");

      fileInput.addEventListener("change", handleChangeFile);

      // Simulate file upload
      fireEvent.change(fileInput, {
        target: {
          files: [new File(["dummy content"], "test.png", { type: "image/png" })],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
    });

    test("Then it should accept files with allowed extensions", async () => {
      // Mock the store's bills().create method
      newBill.store.bills = () => ({
        create: jest.fn().mockResolvedValue({
          key: "1234",
          fileUrl: "https://example.com/file.png",
          fileName: "file.png",
        }),
      });

      const fileInput = screen.getByTestId("file");

      // Simulate file upload with allowed extension
      const file = new File(["dummy content"], "test.png", { type: "image/png" });

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      // Wait for the asynchronous code to complete
      await waitFor(() => expect(newBill.billId).toEqual("1234"));

      expect(newBill.fileUrl).toEqual("https://example.com/file.png");
      expect(newBill.fileName).toEqual("file.png");
      expect(window.alert).not.toHaveBeenCalled();
    });

    test("Then it should show an alert and reset input if file extension is not allowed", () => {
      const fileInput = screen.getByTestId("file");

      // Simulate file upload with disallowed extension
      const file = new File(["dummy content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      expect(window.alert).toHaveBeenCalledWith(
        "Seuls les fichiers avec les extensions jpg, jpeg ou png sont acceptés."
      );
      expect(fileInput.value).toBe("");
    });

    test("Then it should handle API errors", async () => {
      // Mock the store's bills().create method to throw an error
      newBill.store.bills = () => ({
        create: jest.fn().mockRejectedValue(new Error("API Error")),
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const fileInput = screen.getByTestId("file");

      // Simulate file upload with allowed extension
      const file = new File(["dummy content"], "test.png", { type: "image/png" });

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      // Wait for the error handling to complete
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(new Error("API Error"));
      });

      expect(newBill.fileUrl).toBeNull();
      expect(newBill.fileName).toBeNull();
      expect(newBill.billId).toBeNull();
    });

    test("Then it should handle API errors gracefully", async () => {
      // Mock the store's bills().create method to reject with an error
      newBill.store.bills = () => ({
        create: jest.fn().mockRejectedValue(new Error("API Error")),
      });

      // Spy on console.error and mock its implementation
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const fileInput = screen.getByTestId("file");

      // Simulate file upload with allowed extension
      const file = new File(["dummy content"], "test.png", { type: "image/png" });

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      // Wait for the error handling to complete
      await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());

      // Assert that console.error was called with an Error object with the correct message
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(consoleErrorSpy.mock.calls[0][0].message).toBe("API Error");

      expect(newBill.fileUrl).toBeNull();
      expect(newBill.fileName).toBeNull();
      expect(newBill.billId).toBeNull();
    });
  });
});
